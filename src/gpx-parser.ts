import { Coordinate } from "./geojson-types";

// Types from XML schema https://www.topografix.com/GPX/1/1
type Gpx = {
  // version and creator are technically required by the spec, but many files omit them
  version?: "1.1";
  creator?: string;
  metadata?: Metadata;
  wpts: Wpt[];
  rtes: Rte[];
  trks: Trk[];
  extensions?: Extensions;
}
type Metadata = {
  name?: string;
  desc?: string;
  author?: Person;
  copyright?: Copyright;
  links: Link[];
  time?: Date;
  keywords?: string;
  bounds?: Bounds;
  extensions?: Extensions;
}
type Wpt = {
  lat: Latitude;
  lon: Longitude;
  ele?: number;
  time?: Date;
  magvar?: Degrees;
  geoidheight?: number;
  name?: string;
  cmt?: string;
  desc?: string;
  src?: string;
  links: Link[];
  sym?: string;
  type?: string;
  fix?: Fix;
  sat?: number;
  hdop?: number;
  vdop?: number;
  pdop?: number;
  ageofdgpsdata?: number;
  dgpsid?: DgpsStation;
  extensions?: Extensions;
}
type Rte = {
  name?: string;
  cmt?: string;
  desc?: string;
  src?: string;
  links: Link[];
  number?: number;
  type?: string;
  extensions?: Extensions;
  rtepts: Wpt[];
}
type Trk = {
  name?: string;
  cmt?: string;
  desc?: string;
  src?: string;
  links: Link[];
  number?: number;
  type?: string;
  extensions?: Extensions;
  trksegs: TrkSeg[];
}
type Extensions = any;
type TrkSeg = {
  trkpts: Wpt[];
  extensions?: Extensions;
}
type Copyright = {
  author: string;
  year?: number;
  license?: string;
}
type Link = {
  href: string;
  text?: string;
  type?: string;
}
type Email = {
  id: string;
  domain: string;
}
type Person = {
  name?: string;
  email?: Email;
  link?: Link;
}
type Pt = {
  lat: Latitude;
  lon: Longitude;
  ele?: number;
  time?: Date;
}
type PtSeg = {
  pts: Pt[];
}
type Bounds = {
  minlat: Latitude;
  minlon: Longitude;
  maxlat: Latitude;
  maxlon: Longitude;
}
type Latitude = number;
type Longitude = number;
type Degrees = number;
type Fix = "none" | "2d" | "3d" | "dgps" | "pps";
type DgpsStation = number;

export function parseGpx(xmlString: string): Gpx {
  const domParser = new window.DOMParser();
  const document = domParser.parseFromString(xmlString, "text/xml");
  const gpxNode = document.querySelector("gpx");

  if (!gpxNode) {
    throw Error("GPX tag not found in document.");
  }

  const version = gpxNode.getAttribute("version");
  if (version !== null && version !== "1.1") {
    throw Error(`Incompatible GPX version ${version} for parser built for version 1.1`)
  }
  const creator = gpxNode.getAttribute("creator");


  return {
    version: version ?? undefined,
    creator: creator ?? undefined,
    metadata: parseMetadata(gpxNode.querySelector("metadata")),
    wpts: parseListOf(gpxNode, "wpt", parseWpt),
    rtes: parseListOf(gpxNode, "rte", parseRte),
    trks: parseListOf(gpxNode, "trk", parseTrk),
    extensions: parseExtensions(gpxNode.querySelector("extensions")),
  }
}

function parseMetadata(node: Element | null): Metadata | undefined {
  if (node === null) {
    return undefined;
  }

  return {
    name: node.querySelector("name")?.textContent ?? undefined,
    desc: node.querySelector("desc")?.textContent ?? undefined,
    author: parsePerson(node.querySelector("author")),
    copyright: parseCopyright(node.querySelector("copyright")),
    links: parseListOf(node, "link", parseLink),
    time: parseOptionalDate(node.querySelector("time")?.textContent),
    keywords: node.querySelector("keywords")?.textContent ?? undefined,
    bounds: parseBounds(node.querySelector("bounds")),
    extensions: parseExtensions(node.querySelector("extensions")),
  }
}

function parseWpt(node: Element | null): Wpt | undefined {
  if (node === null) {
    return undefined;
  }

  const lat = parseLatitude(node.getAttribute("lat"));
  if (!lat) {
    throw Error("Invalid Wpt: missing 'lat' attribute");
  }

  const lon = parseLongitude(node.getAttribute("lon"));
  if (!lon) {
    throw Error("Invalid Wpt: missing 'lon' attribute");
  }

  return {
    lat,
    lon,
    ele: parseOptionalFloat(node.querySelector("ele")?.textContent),
    time: parseOptionalDate(node.querySelector("time")?.textContent),
    magvar: parseDegrees(node.querySelector("magvar")?.textContent),
    geoidheight: parseOptionalFloat(node.querySelector("geoidheight")?.textContent),
    name: node.querySelector("name")?.textContent ?? undefined,
    cmt: node.querySelector("cmt")?.textContent ?? undefined,
    desc: node.querySelector("desc")?.textContent ?? undefined,
    src: node.querySelector("src")?.textContent ?? undefined,
    links: parseListOf(node, "link", parseLink),
    fix: parseFix(node.querySelector("fix")?.textContent),
    sat: parseOptionalInt(node.querySelector("sat")?.textContent),
    hdop: parseOptionalFloat(node.querySelector("hdop")?.textContent),
    vdop: parseOptionalFloat(node.querySelector("vdop")?.textContent),
    pdop: parseOptionalFloat(node.querySelector("pdop")?.textContent),
    ageofdgpsdata: parseOptionalFloat(node.querySelector("ageofdgpsdata")?.textContent),
    dgpsid: parseDgpsStation(node.querySelector("dgpsid")?.textContent),
    extensions: parseExtensions(node.querySelector("extensions")),
  }
}

function parseRte(node: Element | null): Rte | undefined {
  if (node === null) {
    return undefined;
  }

  return {
    name: node.querySelector("name")?.textContent ?? undefined,
    cmt: node.querySelector("cmt")?.textContent ?? undefined,
    desc: node.querySelector("desc")?.textContent ?? undefined,
    src: node.querySelector("src")?.textContent ?? undefined,
    links: parseListOf(node, "link", parseLink),
    number: parseOptionalInt(node.querySelector("number")?.textContent),
    type: node.querySelector("type")?.textContent ?? undefined,
    extensions: parseExtensions(node.querySelector("extensions")),
    rtepts: parseListOf(node, "rtept", parseWpt),
  }
}

function parseTrk(node: Element | null): Trk | undefined {
  if (node === null) {
    return undefined;
  }

  return {
    name: node.querySelector("name")?.textContent ?? undefined,
    cmt: node.querySelector("cmt")?.textContent ?? undefined,
    desc: node.querySelector("desc")?.textContent ?? undefined,
    src: node.querySelector("src")?.textContent ?? undefined,
    links: parseListOf(node, "link", parseLink),
    number: parseOptionalInt(node.querySelector("number")?.textContent),
    type: node.querySelector("type")?.textContent ?? undefined,
    extensions: parseExtensions(node.querySelector("extensions")),
    trksegs: parseListOf(node, "trkseg", parseTrkSeg),
  }
}

function parseExtensions(node: Element | null): Extensions | undefined {
  if (node === null) {
    return undefined;
  }

  // TODO use own method for this
  return getUnstructuredData(node);
}

function parseTrkSeg(node: Element | null): TrkSeg | undefined {
  if (node === null) {
    return undefined;
  }

  return {
    trkpts: parseListOf(node, "trkpt", parseWpt),
    extensions: parseExtensions(node.querySelector("extensions")),
  }
}

function parseCopyright(node: Element | null): Copyright | undefined {
  if (node === null) {
    return undefined;
  }

  const author = node.getAttribute("author");
  if (!author) {
    throw Error("Invalid Copyright tag: missing 'author' attribute");
  }

  return {
    author,
    year: parseOptionalInt(node.querySelector("year")?.textContent),
    license: node.querySelector("license")?.textContent ?? undefined,
  }
}

function parseLink(node: Element | null): Link | undefined {
  if (node === null) {
    return undefined;
  }

  const href = node.getAttribute("href");
  if (!href) {
    throw Error("Invalid Link tag: missing 'href' attribute");
  }

  return {
    href,
    text: node.querySelector("text")?.textContent ?? undefined,
    type: node.querySelector("type")?.textContent ?? undefined,
  }
}

function parseEmail(node: Element | null): Email | undefined {
  if (node === null) {
    return undefined;
  }

  const id = node.getAttribute("id");
  if (!id) {
    throw Error("Invalid Email tag: missing 'id' attribute");
  }

  const domain = node.getAttribute("domain");
  if (!domain) {
    throw Error("Invalid Email tag: missing 'domain' attribute");
  }

  return {
    id,
    domain,
  }
}

function parsePerson(node: Element | null): Person | undefined {
  if (node === null) {
    return undefined;
  }

  return {
    name: node.querySelector("name")?.textContent ?? undefined,
    email: parseEmail(node.querySelector("email")),
    link: parseLink(node.querySelector("link")),
  }
}

function parsePt(node: Element | null): Pt | undefined {
  if (node === null) {
    return undefined;
  }

  const lat = parseLatitude(node.getAttribute("lat"));
  if (!lat) {
    throw Error("Invalid Pt: missing 'lat' attribute");
  }

  const lon = parseLongitude(node.getAttribute("lon"));
  if (!lon) {
    throw Error("Invalid Pt: missing 'lon' attribute");
  }

  return {
    lat,
    lon,
    ele: parseOptionalFloat(node.querySelector("ele")?.textContent),
    time: parseOptionalDate(node.querySelector("time")?.textContent),
  }
}

function parsePtSeg(node: Element | null): PtSeg | undefined {
  if (node === null) {
    return undefined;
  }

  return {
    pts: parseListOf(node, "pt", parsePt),
  }
}

function parseBounds(node: Element | null): Bounds | undefined {
  if (node === null) {
    return undefined;
  }

  const minlat = parseLatitude(node.getAttribute("minlat"));
  if (!minlat) {
    throw Error("Invalid Bounds: missing 'minlat' attribute");
  }

  const minlon = parseLongitude(node.getAttribute("minlon"));
  if (!minlon) {
    throw Error("Invalid Bounds: missing 'minlon' attribute");
  }

  const maxlat = parseLatitude(node.getAttribute("maxlat"));
  if (!maxlat) {
    throw Error("Invalid Bounds: missing 'maxlat' attribute");
  }

  const maxlon = parseLongitude(node.getAttribute("maxlon"));
  if (!maxlon) {
    throw Error("Invalid Bounds: missing 'maxlon' attribute");
  }

  return {
    minlat,
    minlon,
    maxlat,
    maxlon,
  }
}

function parseLatitude(str: string | null): Latitude | undefined {
  if (!str) {
    return undefined;
  }

  const val = parseFloat(str);
  if (isNaN(val) || val < -90 || val > 90) {
    throw Error(`Invalid latitude: ${str}`);
  }

  return val;
}

function parseLongitude(str: string | null): Longitude | undefined {
  if (!str) {
    return undefined;
  }

  const val = parseFloat(str);
  if (isNaN(val) || val < -180 || val >= 180) {
    throw Error(`Invalid longitude: ${str}`);
  }

  return val;
}

function parseDegrees(str: string | null | undefined): Degrees | undefined {
  if (!str) {
    return undefined;
  }

  const val = parseFloat(str);
  if (isNaN(val) || val < 0 || val >= 360) {
    throw Error(`Invalid degrees: ${str}`);
  }

  return val;
}

function parseFix(str: string | null | undefined): Fix | undefined {
  if (!str) {
    return undefined;
  }

  const options = ["none", "2d", "3d", "dgpx", "pps"];
  if (!options.includes(str)) {
    throw Error(`Invalid fix. Expected ${options.join(", ")}. Found ${str}`);
  }

  return str as Fix;
}

function parseDgpsStation(str: string | null | undefined): DgpsStation | undefined {
  if (!str) {
    return undefined;
  }

  const val = parseInt(str);
  if (isNaN(val) || val < 0 || val > 1023) {
    throw Error(`Invalid DgpsStation: ${str}`);
  }

  return val;
}

function parseListOf<T>(node: Element, selector: string, parser: (node: Element | null) => T | undefined): T[] {
  return Array.from(node.querySelectorAll(selector)).map(parser).filter(e => !!e) as T[];
}

function parseOptionalInt(str: string | null | undefined): number | undefined {
  if (!str) {
    return undefined;
  }

  const val = parseInt(str);
  if (isNaN(val)) {
    throw Error(`Invalid int: ${str}`);
  }

  return val;
}

function parseOptionalFloat(str: string | null | undefined): number | undefined {
  if (!str) {
    return undefined;
  }

  const val = parseFloat(str);
  if (isNaN(val)) {
    throw Error(`Invalid int: ${str}`);
  }

  return val;
}

function parseOptionalDate(str: string | null | undefined): Date | undefined {
  if (!str) {
    return undefined;
  }

  const val = new Date(str);

  return val;
}

// MIT License

// Copyright (c) 2018 Lucas Trebouet Voisin
// https://github.com/Luuka/GPXParser.js
// Heavily modified by Tyler Jaszkowiak

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.


function getUnstructuredData(node) {
  if (node === null || node === undefined) {
    return null;
  }
  switch (node.nodeType) {
    case 1: // element
    case 9: // document
      if (node.childNodes.length === 1 && node.childNodes[0].nodeType === 3) {
        return node.childNodes[0].nodeValue;
      }
      let ob = {};
      for (let i = 0; i < node.childNodes.length; i++) {
        attachOptional(
          ob,
          node.childNodes[i].nodeName,
          getUnstructuredData(node.childNodes[i]),
        );
      }
      return ob;
    case 2: // attribute
      return node.nodeValue;
    case 3: // text
      const strval = node.nodeValue.trim();
      return strval.length > 0 ? strval : null;
    case 8: // comment
      return null;
  }
  return null;
}

function attachOptional(obj, name, val) {
  if (val !== null && val !== undefined && val.length !== 0) {
    obj[name] = val;
  }
}

gpxParser.prototype.calculate = function () {
  for (const track of this.tracks) {
    for (const segment of track.segments) {
      calculatePointContainer(segment);
    }
    attachOptional(
      track,
      "startTime",
      track.segments?.[0]?.startTime?.getTime(),
    );
    attachOptional(
      track,
      "duration",
      track.segments?.reduce((d, s) => d + s.duration, 0),
    ); // TODO can be undefined if s.duration is
    attachOptional(
      track,
      "distance",
      track.segments?.reduce((d, s) => d + s.distance, 0),
    );
    attachOptional(
      track,
      "cumulativeDistance",
      track.segments?.map((s) => s.distance),
    );
    attachOptional(
      track,
      "minElevation",
      track.segments?.reduce(
        (e, s) => Math.min(s.minElevation, e),
        track.segments[0].minElevation,
      ),
    );
    attachOptional(
      track,
      "maxElevation",
      track.segments?.reduce(
        (e, s) => Math.max(s.maxElevation, e),
        track.segments[0].maxElevation,
      ),
    );
    attachOptional(
      track,
      "gain",
      track.segments?.reduce((d, s) => d + s.gain, 0),
    );
    attachOptional(
      track,
      "loss",
      track.segments?.reduce((d, s) => d + s.loss, 0),
    );
  }
  for (const route of this.routes) {
    calculatePointContainer(route);
  }
  return this;
};

function calculatePointContainer(container) {
  const points = container.points;
  if (points.length > 0) {
    // calculate startTime and duration from .time
    if (points[0].time) {
      // set startTime
      container.startTime = points[0].time;
      if (points[points.length - 1].time) {
        // set duration
        container.duration = points[points.length - 1].time - points[0].time;
      }
    }
    // Calculate distance from position
    let totalDist = 0;
    const cumulativeDist = [0];
    for (let i = 1; i < points.length; i++) {
      // TODO bearing at each point?
      totalDist += calcDistanceBetween(points[i - 1], points[i]);
      cumulativeDist.push(totalDist);
    }
    // set distance, cumulativeDist
    container.distance = totalDist;
    container.cumulativeDist = cumulativeDist;
    // Calculate gain, loss, min elev, max elev
    if (points[0]?.ele) {
      let minElev = points[0].ele;
      let maxElev = minElev;
      let gain = 0;
      let loss = 0;
      // TODO cumulative gain, loss?
      for (let i = 1; i < points.length; i++) {
        const currElev = points[i].ele;
        if (currElev > maxElev) maxElev = currElev;
        if (currElev < minElev) minElev = currElev;
        const diff = currElev - points[i - 1].ele;
        if (diff < 0) {
          loss -= diff;
        } else {
          gain += diff;
        }
      }
      container.minElevation = minElev;
      container.maxElevation = maxElev;
      container.gain = gain;
      container.loss = loss;
    }
  }
  return container;
}

/**
 * Calcul Distance between two points with lat and lon
 *
 * @param  {} wpt1 - A geographic point with lat and lon properties
 * @param  {} wpt2 - A geographic point with lat and lon properties
 *
 * @returns {float} The distance between the two points
 */
function calcDistanceBetween(wpt1: Point, wpt2: Point) {
  var rad = Math.PI / 180,
    lat1 = wpt1.lat * rad,
    lat2 = wpt2.lat * rad,
    sinDLat = Math.sin(((wpt2.lat - wpt1.lat) * rad) / 2),
    sinDLon = Math.sin(((wpt2.lon - wpt1.lon) * rad) / 2),
    a = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon,
    c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return 6371000 * c;
}

// functions below are for converting from processed GPX to GeoJSON
function pointToGeoJSONCoordinate(pt: Point) {
  let coord: Coordinate = [];
  coord.push(pt.lon);
  coord.push(pt.lat);
  if (pt.ele !== null && pt.ele !== undefined) {
    coord.push(pt.ele);
  }
  return coord;
}

function segmentToGeoJSONCoordinates(segment) {
  return segment.points.map(pointToGeoJSONCoordinate);
}

function trackToGeoJSONMultiLineString(track) {
  const { ["segments"]: segments, ...properties } = track;
  return {
    type: "Feature",
    geometry: {
      type: "MultiLineString",
      coordinates: segments.map(segmentToGeoJSONCoordinates),
    },
    properties: properties,
  };
}

function routeToGeoJSONLineString(route) {
  const { ["points"]: points, ...properties } = route;
  return {
    type: "Feature",
    geometry: {
      type: "LineString",
      coordinates: points.map(pointToGeoJSONCoordinate),
    },
    properties: properties,
  };
}

function waypointToGeoJSONPoint(pt) {
  const { ["lat"]: lat, ["lon"]: lon, ...properties } = pt;
  return {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: pointToGeoJSONCoordinate(pt),
    },
    properties: properties,
  };
}

/**
 * Export the GPX object to a GeoJSON formatted Object
 *
 * @returns {} a GeoJSON formatted Object
 */
gpxParser.prototype.toGeoJSON = function () {
  var GeoJSON = {
    type: "FeatureCollection",
    features: [],
    properties: this.metadata,
  };

  GeoJSON.features = GeoJSON.features.concat(
    this.tracks.map(trackToGeoJSONMultiLineString),
  );
  GeoJSON.features = GeoJSON.features.concat(
    this.routes.map(routeToGeoJSONLineString),
  );
  GeoJSON.features = GeoJSON.features.concat(
    this.waypoints.map(waypointToGeoJSONPoint),
  );

  return GeoJSON;
};
