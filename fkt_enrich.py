#!/usr/bin/env python3
"""Enrich an FKT routes GeoJSON by scraping fastestknowntime.com.

For every feature whose point geometry lies within a given radius of a
supplied latitude/longitude, the feature's description URL is followed to its
page on fastestknowntime.com. Extra properties are scraped from that page and,
when a GPX track is available, the feature's Point geometry is upgraded to a
LineString that follows the recorded track.

Usage:
    python fkt_enrich.py INPUT OUTPUT LAT LON RADIUS [--units {km,mi}]
                         [--headed] [--limit N]

Only the features that fall inside the radius are written to OUTPUT.

Requires:
    pip install playwright beautifulsoup4
    playwright install chromium
"""

from __future__ import annotations

import argparse
import json
import math
import re
import sys
import xml.etree.ElementTree as ET
from urllib.parse import urljoin

from bs4 import BeautifulSoup, NavigableString
from playwright.sync_api import sync_playwright

BASE_URL = "https://fastestknowntime.com/"
EARTH_RADIUS_KM = 6371.0088


# --------------------------------------------------------------------------- #
# Geometry helpers
# --------------------------------------------------------------------------- #
def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance between two points, in kilometers."""
    rlat1, rlat2 = math.radians(lat1), math.radians(lat2)
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(rlat1) * math.cos(rlat2) * math.sin(dlon / 2) ** 2
    )
    return 2 * EARTH_RADIUS_KM * math.asin(math.sqrt(a))


def feature_lonlat(feature: dict) -> tuple[float, float] | None:
    """Return (lon, lat) for a Point feature, or None if unavailable."""
    geom = feature.get("geometry") or {}
    if geom.get("type") != "Point":
        return None
    coords = geom.get("coordinates") or []
    if len(coords) < 2:
        return None
    return float(coords[0]), float(coords[1])


# --------------------------------------------------------------------------- #
# HTML parsing helpers
# --------------------------------------------------------------------------- #
def extract_route_url(description_html: str) -> str | None:
    """Pull the first anchor href out of a feature's description HTML."""
    if not description_html:
        return None
    soup = BeautifulSoup(description_html, "html.parser")
    anchor = soup.find("a", href=True)
    return anchor["href"] if anchor else None


def _text_or_none(node) -> str | None:
    if node is None:
        return None
    text = node.get_text(" ", strip=True)
    return text or None


def _field_item_text(soup: BeautifulSoup, field_class: str) -> str | None:
    """Return the `.field--item` text for a Drupal field wrapper by class."""
    field = soup.select_one(f".{field_class}")
    if field is None:
        return None
    item = field.select_one(".field--item")
    return _text_or_none(item if item is not None else field)


def parse_description_field(soup: BeautifulSoup) -> str | None:
    """Prefer the expanded `.details` text, falling back to the field item."""
    field = soup.select_one(".field--name-field-description")
    if field is None:
        return None
    details = field.select_one(".details")
    if details is not None:
        return _text_or_none(details)
    item = field.select_one(".field--item")
    return _text_or_none(item if item is not None else field)


def parse_fkts(soup: BeautifulSoup) -> list[dict]:
    """Parse `.view-fkts-on-route` blocks into a flat list of FKT records.

    Gender is expressed as loose text nodes preceding each results table, and
    the style (Supported / Unsupported / Self-Supported / ...) is the table's
    caption. Both are captured for every athlete row.
    """
    records: list[dict] = []

    for view in soup.select(".view-fkts-on-route"):
        content = view.select_one(".view-content")
        if content is None:
            continue

        current_gender: str | None = None
        for child in content.children:
            if isinstance(child, NavigableString):
                label = child.strip()
                if label:
                    current_gender = label
                continue

            # A tag: it may itself be a table or contain one or more tables.
            tables = (
                [child]
                if getattr(child, "name", None) == "table"
                else child.find_all("table")
            )
            for table in tables:
                caption = table.find("caption")
                style = _text_or_none(caption)
                for row in table.select("tbody tr"):
                    record = _parse_fkt_row(row)
                    if record is None:
                        continue
                    record["gender"] = current_gender
                    record["style"] = style
                    records.append(record)

    return records


def _parse_fkt_row(row) -> dict | None:
    athlete_cell = row.select_one(".views-field-field-athlete")
    time_cell = row.select_one(".views-field-field-time-duration-")
    date_cell = row.select_one(".views-field-field-date-of-attempt")

    athlete_link = athlete_cell.find("a", href=True) if athlete_cell else None
    athlete_name = _text_or_none(athlete_cell)
    if not athlete_name:
        return None

    time_text = None
    if time_cell is not None:
        time_text = " ".join(time_cell.get_text(" ", strip=True).split())

    date_text = None
    if date_cell is not None:
        time_el = date_cell.find("time")
        if time_el is not None and time_el.has_attr("datetime"):
            date_text = time_el["datetime"]
        else:
            date_text = _text_or_none(date_cell)

    return {
        "athlete": athlete_name,
        "athlete_url": urljoin(BASE_URL, athlete_link["href"]) if athlete_link else None,
        "time": time_text,
        "date": date_text,
        "multi_sport": _text_or_none(row.select_one(".views-field-field-multi-sport")),
        "para_athlete": _text_or_none(row.select_one(".views-field-field-para-athlete")),
        "flagged": _text_or_none(row.select_one(".views-field-field-flagged")),
    }


def _count_key_segment(label: str) -> str:
    """Turn a gender/style label into a PascalCase key segment.

    e.g. "Self-Supported" -> "SelfSupported", "Mixed-Gender Team" ->
    "MixedGenderTeam".
    """
    tokens = re.split(r"[^0-9A-Za-z]+", label)
    return "".join(token[:1].upper() + token[1:] for token in tokens if token)


def compute_fkt_counts(fkts: list[dict]) -> dict:
    """Return the overall FKT count plus a count per gender/style product.

    Keys are concatenated as ``fktsCount<Gender><Style>`` (e.g.
    ``fktsCountMaleSupported``). Rows missing a gender or style are still
    included in the overall ``fktsCount`` but not in any product key.
    """
    counts: dict[str, int] = {"fktsCount": len(fkts)}
    for record in fkts:
        gender = record.get("gender")
        style = record.get("style")
        if not gender or not style:
            continue
        key = "fktsCount" + _count_key_segment(gender) + _count_key_segment(style)
        counts[key] = counts.get(key, 0) + 1
    return counts


def parse_page(html: str) -> dict:
    """Extract the scraped properties (and any GPX URL) from a route page."""
    soup = BeautifulSoup(html, "html.parser")

    state = _text_or_none(soup.select_one(".address-state"))
    if state:
        state = state.rstrip(",").strip()
    country = _text_or_none(soup.select_one(".address-country"))

    gps_link = soup.select_one(".field--name-field-gps-track a[href]")
    gpx_url = urljoin(BASE_URL, gps_link["href"]) if gps_link else None

    return {
        "state": state,
        "country": country,
        "distance": _field_item_text(soup, "field--name-field-distance"),
        "vertical_gain": _field_item_text(soup, "field--name-field-vertical-gain"),
        "route_description": parse_description_field(soup),
        "fkts": parse_fkts(soup),
        "_gpx_url": gpx_url,
    }


# --------------------------------------------------------------------------- #
# GPX parsing
# --------------------------------------------------------------------------- #
def parse_gpx(gpx_bytes: bytes) -> list[list[float]]:
    """Return an ordered list of [lon, lat] pairs from a GPX document.

    Track points are preferred; route points and waypoints are used as a
    fallback. Namespaces are ignored by matching on the local tag name.
    """
    try:
        root = ET.fromstring(gpx_bytes)
    except ET.ParseError:
        return []

    def local(tag: str) -> str:
        return tag.rsplit("}", 1)[-1]

    def collect(tag_name: str) -> list[list[float]]:
        points: list[list[float]] = []
        for el in root.iter():
            if local(el.tag) != tag_name:
                continue
            lat = el.get("lat")
            lon = el.get("lon")
            if lat is None or lon is None:
                continue
            points.append([float(lon), float(lat)])
        return points

    for tag_name in ("trkpt", "rtept", "wpt"):
        points = collect(tag_name)
        if points:
            return points
    return []


# --------------------------------------------------------------------------- #
# Feature processing
# --------------------------------------------------------------------------- #
def process_feature(feature: dict, page, base_url: str) -> None:
    """Scrape and mutate a single feature in place."""
    props = feature.setdefault("properties", {})
    route_path = extract_route_url(props.get("description", ""))
    if not route_path:
        print(f"  ! no route URL in description; skipping", file=sys.stderr)
        return

    url = urljoin(base_url, route_path)
    print(f"  -> {url}", file=sys.stderr)
    page.goto(url, wait_until="domcontentloaded")
    html = page.content()

    scraped = parse_page(html)
    gpx_url = scraped.pop("_gpx_url", None)

    for key, value in scraped.items():
        props[key] = value
    props["source_url"] = url

    for key, value in compute_fkt_counts(scraped.get("fkts") or []).items():
        props[key] = value

    if gpx_url:
        props["gpx_url"] = gpx_url
        try:
            response = page.context.request.get(gpx_url)
            if response.ok:
                coords = parse_gpx(response.body())
                if coords:
                    feature["geometry"] = {
                        "type": "LineString",
                        "coordinates": coords,
                    }
                    print(f"     GPX: {len(coords)} points -> LineString", file=sys.stderr)
                else:
                    print("     GPX had no track points", file=sys.stderr)
            else:
                print(f"     GPX download failed: {response.status}", file=sys.stderr)
        except Exception as exc:  # noqa: BLE001 - keep going on any GPX error
            print(f"     GPX error: {exc}", file=sys.stderr)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", help="Path to the input GeoJSON file")
    parser.add_argument("output", help="Path to write the enriched GeoJSON")
    parser.add_argument("lat", type=float, help="Center latitude")
    parser.add_argument("lon", type=float, help="Center longitude")
    parser.add_argument("radius", type=float, help="Radius around the center")
    parser.add_argument(
        "--units",
        choices=("km", "mi"),
        default="km",
        help="Units for the radius (default: km)",
    )
    parser.add_argument(
        "--headed",
        action="store_true",
        help="Run the browser with a visible window (default: headless)",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Only process the first N in-radius features (for testing)",
    )
    args = parser.parse_args(argv)

    radius_km = args.radius if args.units == "km" else args.radius * 1.609344

    with open(args.input, "r", encoding="utf-8") as fh:
        data = json.load(fh)

    features = data.get("features", [])

    # Select features within the radius.
    selected: list[dict] = []
    for feature in features:
        lonlat = feature_lonlat(feature)
        if lonlat is None:
            continue
        lon, lat = lonlat
        if haversine_km(args.lat, args.lon, lat, lon) <= radius_km:
            selected.append(feature)

    if args.limit is not None:
        selected = selected[: args.limit]

    print(
        f"{len(selected)} of {len(features)} features within "
        f"{args.radius} {args.units}",
        file=sys.stderr,
    )

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=not args.headed)
        page = browser.new_page()
        try:
            for index, feature in enumerate(selected, start=1):
                name = (feature.get("properties") or {}).get("name", "<unnamed>")
                print(f"[{index}/{len(selected)}] {name}", file=sys.stderr)
                try:
                    process_feature(feature, page, BASE_URL)
                except Exception as exc:  # noqa: BLE001 - one bad page shouldn't abort
                    print(f"  ! error processing feature: {exc}", file=sys.stderr)
        finally:
            browser.close()

    output = {
        "type": "FeatureCollection",
        "features": selected,
    }
    if "crs" in data:
        output["crs"] = data["crs"]

    with open(args.output, "w", encoding="utf-8") as fh:
        json.dump(output, fh, ensure_ascii=False, indent=2)

    print(f"Wrote {len(selected)} features to {args.output}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
