import L from "leaflet";
import { svgArray } from "./maki";
import math from "./math";
import Svg from "./PatternRenderer/Svg";
import { svgArray as temakiSvgArray } from "./temaki";

export function svgMarker(
  latlng: L.LatLngExpression,
  svg: HTMLElement | string,
): L.Marker<any> {
  return L.marker(latlng, { icon: svgIcon(svg) });
}

function svgIcon(svg: HTMLElement | string): L.DivIcon {
  return L.divIcon({
    html: svg,
    className: "",
  });
}

// create the SVG path commands for an n-gon of radius r
function svgPolygon(
  n: number,
  r: number,
  stroke: string,
  fill: string | undefined,
  text: string | undefined,
): string {
  let strokeFill = `stroke="${stroke ?? "#336799"}" fill="${fill ?? stroke ?? "#336799"}"`;
  let str = `<svg width="${2 * r}" height="${2 * r}" viewBox="-50 -50 100 100" xmlns="http://www.w3.org/2000/svg">`;
  if (n === Infinity) {
    // circle
    str += `<circle cx="0" cy="0" r="50" ${strokeFill} />`;
  } else {
    let points: [number, number][] = [];
    const da = 360.0 / n;
    for (let a = da / 2; a < 360.0; a += da) {
      points.push(math.ar(a, 50)); // hardcode 50 if viewbox is 100x100
    }
    let cmds = "M" + points[0][0] + " " + points[0][1];
    for (let i = 1; i < points.length; i++) {
      cmds += " L" + points[i][0] + " " + points[i][1];
    }
    cmds += "Z";
    str += `<path d="${cmds}" ${strokeFill} />`;
  }
  if (text) {
    str += `<text x="50" y="50" font-size="100"  dominant-baseline="middle" text-anchor="middle">${text}</text>`;
  }
  str += "</svg>";
  return str;
}

export function PolygonMarker(
  latlng: L.LatLngExpression,
  n: number,
  r: number,
  stroke: string,
  fill?: string,
  text?: string,
): L.Marker<any> {
  return svgMarker(latlng, svgPolygon(n, r, stroke, fill, text));
}

// create the SVG path commands for an n-star of radius r
function svgStar(
  n: number,
  r: number,
  stroke: string,
  fill: string | undefined,
  text: string | undefined,
): string {
  let strokeFill = `stroke="${stroke ?? "#336799"}" fill="${fill ?? stroke ?? "#336799"}"`;
  let str = `<svg width="${2 * r}" height="${2 * r}" viewBox="-50 -50 100 100" xmlns="http://www.w3.org/2000/svg">`;
  if (n === Infinity) {
    // circle
    str += `<circle cx="0" cy="0" r="50" ${strokeFill} />`;
  } else {
    let points: [number, number][] = [];
    const da = 360.0 / (2 * n);
    for (let a = 0; a < 360.0; a += da) {
      points.push(math.ar(a, n % 2 === points.length % 2 ? 50 : 25)); // hardcode if viewbox is 100x100
    }
    let cmds = "M" + points[0][0] + " " + points[0][1];
    for (let i = 1; i < points.length; i++) {
      cmds += " L" + points[i][0] + " " + points[i][1];
    }
    cmds += "Z";
    str += `<path d="${cmds}" ${strokeFill} />`;
  }
  if (text) {
    str += `<text x="0" y="0" font-size="50"  dominant-baseline="middle" text-anchor="middle">${text}</text>`;
  }
  str += "</svg>";
  return str;
}

export function StarMarker(
  latlng: L.LatLngExpression,
  n: number,
  r: number,
  stroke: string,
  fill?: string,
  text?: string,
): L.Marker<any> {
  return svgMarker(latlng, svgStar(n, r, stroke, fill, text));
}

function svgPath(
  path: string,
  stroke?: string,
  fill?: string,
  width?: number,
  height?: number,
) {
  const strokeFill = `stroke="${stroke ?? "#336799"}" fill="${fill ?? stroke ?? "#336799"}"`;
  return `<svg
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
    width="${width ?? 15}"
    height="${height ?? 15}"
    viewBox="0 0 15 15"
  >
    <path d="${path}" ${strokeFill} />
  </svg>`
}

export function SvgPathMarker(
  latlng: L.LatLngExpression,
  path: string,
  stroke?: string,
  fill?: string,
  width?: number,
  height?: number,
) {
  const svgString = svgPath(path, stroke, fill, width, height);
  return svgMarker(latlng, svgString);
}

function fromSvgArray(svgArray: string[]) {
  return Object.fromEntries(svgArray.map(xmlString => {
    let domParser = new window.DOMParser();
    const xml = domParser.parseFromString(xmlString, "text/xml");
    const svg = xml.getElementsByTagName("svg")[0];
    const id = svg.getAttribute("id");
    const svgPaths = svg.getElementsByTagName("path");
    let d = Array.from(svgPaths).map(p => p.getAttribute("d")).join("");
    if (!id?.length) {
      throw new Error("Undefined or blank svg.id")
    }
    if (!d?.length) {
      throw new Error("Undefined or blank path.d!")
    }
    const viewBox = svg.getAttribute("viewBox");
    if (!viewBox?.length) {
      throw new Error("Undefined or blank svg.viewBox!")
    }
    if (viewBox !== "0 0 15 15" && typeof viewBox === "string") {
      console.error(`viewBox for ${id} : ${svg.getAttribute("viewBox")}`)
      d = Svg.toString(Svg.scale(Svg.parse(d), 15 / (parseInt(viewBox.split(" ")[3]))))
    }
    return [id ?? "undefined", d];
  }))
}

const makiPaths = fromSvgArray(svgArray)
const temakiPaths = fromSvgArray(temakiSvgArray)
// TODO reuse SvgPatternWithLabel
export const markersLibrary = {
  Points: [
    { label: "point", pattern: makiPaths.circle },
    { label: "c:ring", pattern: makiPaths["circle-stroked"] },
    { label: "c:target1", pattern: makiPaths["circle-stroked"] + "M6.5 7.5A1 1 0 0 0 8.5 7.5A1 1 0 0 0 6.5 7.5" },
    // TODO { label: "c:target2", pattern: "" },
    { label: "c:target3", pattern: "M 1 7 A 6 6 0 0 1 7 1 H 8 A 6 6 0 0 1 14 7 V 8 A 6 6 0 0 1 8 14 H 7 A 6 6 0 0 1 1 8 V 7 Z M 7 2 a 5 5 0 0 0 -5 5 h 3 a 2 2 0 0 1 2 -2 z M 2 8 a 5 5 0 0 0 5 5 v -3 a 2 2 0 0 1 -2 -2 z M 8 13 a 5 5 0 0 0 5 -5 h -3 a 2 2 0 0 1 -2 2 z M 13 7 a 5 5 0 0 0 -5 -5 v 3 a 2 2 0 0 1 2 2 z M 7 6 a 1 1 0 0 0 -1 1 h 1 z M 6 8 a 1 1 0 0 0 1 1 v -1 z M 8 9 a 1 1 0 0 0 1 -1 h -1 z M 9 7 a 1 1 0 0 0 -1 -1 v 1 z" },
  ],
  Arrows: [
    // TODO { label: "a:0", pattern: "" },
    // TODO { label: "a:1", pattern: "" },
    { label: "a:2", pattern: Svg.toString(Svg.translate(Svg.rotate(Svg.parse(makiPaths.arrow), -Math.PI / 2), 0, 15)) },
    // TODO { label: "a:3", pattern: "" },
    // TODO { label: "a:4", pattern: "" },
  ],
  Pins: [
    // TODO { label: "pin", pattern: "" },
    { label: "placemark2", pattern: temakiPaths["temaki-pin"] },
    // TODO { label: "flag-1", pattern: "" },
    // TODO { label: "flag-2", pattern: "" },
  ],
  // TODO any two characters inside a circle: "t:!", "T:00", etc.
  // some characters like ! go in a black circle. Most go in a white circle
  // TODO "circle-a" through "circle-z" and "circle-1" through "circle-10"
  Recreation: [
    { label: "hut", pattern: temakiPaths["temaki-hut"] },
    { label: "lodging", pattern: makiPaths.lodging },
    { label: "leanto", pattern: temakiPaths["temaki-sleep_shelter"] },
    { label: "shelter-empty", pattern: makiPaths.shelter },
    { label: "shelter-picnic", pattern: temakiPaths["temaki-picnic_shelter"] },
    { label: "picnicbench", pattern: makiPaths["picnic-site"] },
    { label: "camping", pattern: makiPaths.campsite },
    { label: "campfire", pattern: temakiPaths["temaki-campfire"] },
    { label: "flame", pattern: makiPaths["fire-station"] },
    { label: "photo", pattern: makiPaths.attraction },
    { label: "radiotower", pattern: makiPaths["communications-tower"] },
    { label: "firelookout", pattern: makiPaths["observation-tower"] },
    { label: "lighthouse", pattern: makiPaths.lighthouse },
    { label: "anchorage", pattern: makiPaths.harbor },
    // TODO { label: "lifepreserver", pattern: "" },
    { label: "marsh", pattern: makiPaths.wetland },
    { label: "waterfalls", pattern: makiPaths.waterfall },
    { label: "peak", pattern: makiPaths.mountain },
    { label: "drinking-water", pattern: makiPaths["drinking-water"] },
    { label: "phone", pattern: makiPaths.telephone },
    { label: "shower", pattern: temakiPaths["temaki-shower"] },
    { label: "firstaidplus", pattern: temakiPaths["temaki-briefcase_cross"] },
    { label: "binoc", pattern: temakiPaths["temaki-binoculars"] },
    { label: "fuel", pattern: makiPaths.fuel },
    { label: "info", pattern: makiPaths.information },
    { label: "automobile", pattern: makiPaths.car },
    // TODO { label: "4wd", pattern: "" },
    // TODO { label: "atv", pattern: "" },
    { label: "snowmobiling", pattern: temakiPaths["temaki-snowmobile"] },
    // TODO { label: "snowmobiling-no", pattern: "" },
    { label: "gate-side", pattern: temakiPaths["temaki-gate"] },
    // TODO { label: "bicycling-uphill", pattern: "" },
    { label: "bicycling", pattern: makiPaths.bicycle },
    // TODO { label: "bicycling-downhill", pattern: "" },
    // TODO { label: "bicycle-no", pattern: "" },
    // TODO { label: "hiking-uphill", pattern: "" },
    // TODO { label: "hiking", pattern: "" },
    // TODO { label: "hiking-downhill", pattern: "" },
    { label: "snowshoeing", pattern: temakiPaths["temaki-snow_shoeing"] },
    { label: "iceskating", pattern: temakiPaths["temaki-ice_skating"] },
    { label: "skiing-xc", pattern: temakiPaths["temaki-cross_country_skiing"] },
    { label: "skiing-downhill", pattern: makiPaths.skiing },
    { label: "snowboarding", pattern: temakiPaths["temaki-snowboarding"] },
    { label: "sledding", pattern: temakiPaths["temaki-sledding"] },
    { label: "chairlift", pattern: temakiPaths["temaki-chairlift"] },
    // TODO { label: "caving", pattern: "" },
    { label: "scrambling", pattern: temakiPaths["temaki-climbing"] },
    { label: "climbing-2", pattern: temakiPaths["temaki-abseiling"] },
    // TODO { label: "climbing-1", pattern: "" },
    // TODO { label: "rappelling", pattern: "" },
    { label: "hanggliding", pattern: temakiPaths["temaki-hang_gliding"] },
    // TODO { label: "paragliding", pattern: "" },
    { label: "canoeing-1", pattern: temakiPaths["temaki-canoe"] },
    { label: "river-rafting", pattern: temakiPaths["temaki-rafting"] },
    { label: "sailing", pattern: temakiPaths["temaki-sailing"] },
    { label: "windsurfing", pattern: temakiPaths["temaki-wind_surfing"] },
    { label: "personal-watercraft", pattern: temakiPaths["temaki-jet_skiing"] },
    // TODO { label: "snorkeling", pattern: "" },
    { label: "swimming", pattern: makiPaths.swimming },
    { label: "surfing", pattern: temakiPaths["temaki-surfing"] },
    // TODO { label: "tidepool", pattern: "" },
    { label: "diving", pattern: temakiPaths["temaki-diving"] },
    { label: "beach", pattern: makiPaths.beach },
    { label: "fishing", pattern: temakiPaths["temaki-fishing_pier"] },
    // TODO { label: "shooting", pattern: "" },
    // TODO { label: "canoeing-2", pattern: "" },
    { label: "kayaking", pattern: temakiPaths["temaki-kayaking"] },
    { label: "boatlaunch", pattern: temakiPaths["temaki-boat_ramp"] },
    { label: "rockfall", pattern: temakiPaths["temaki-cliff_falling_rocks"] },
    // TODO { label: "slip", pattern: "" },
    // TODO { label: "cliff-edge", pattern: "" },
    { label: "danger", pattern: makiPaths.danger },
    // TODO { label: "aed", pattern: "" },
    { label: "atm", pattern: temakiPaths["temaki-atm2"] },
    { label: "busstop", pattern: makiPaths.bus },
    { label: "construction", pattern: makiPaths.construction },
    { label: "dogs-offleash", pattern: makiPaths["dog-park"] },
    // TODO { label: "dogs-onleash", pattern: "" },
    // TODO { label: "dogs-no", pattern: "" },
    { label: "horses-riding", pattern: makiPaths["horse-riding"] },
    // TODO { label: "horses-no", pattern: "" },
    { label: "electric-hookup", pattern: temakiPaths["temaki-electronic"] },
    { label: "electric-charging", pattern: makiPaths["charging-station"] },
    { label: "foodservice", pattern: makiPaths.restaurant },
    { label: "golf", pattern: makiPaths.golf },
    { label: "wheelchair", pattern: makiPaths.wheelchair },
    { label: "low-vision-access", pattern: temakiPaths["temaki-blind"] },
    // TODO { label: "maps", pattern: "" },
    { label: "rangerstation2", pattern: makiPaths["ranger-station"] },
    { label: "recycling", pattern: makiPaths.recycling },
    { label: "rv-campground", pattern: temakiPaths["temaki-camper_trailer"] },
    { label: "tramway", pattern: makiPaths.aerialway },
    { label: "trashcan", pattern: makiPaths["waste-basket"] },
    // TODO { label: "wifi", pattern: "" },
    { label: "airport", pattern: makiPaths.airport },
    { label: "wilderness", pattern: temakiPaths["temaki-tree_needleleaved"] },
  ],
  Basic: [
    { label: "circle", pattern: "M0 7.5A7.5 7.5 0 0 0 15 7.5A7.5 7.5 0 1 0 0 7.5Z" },
    { label: "X", pattern: "M0 2l5.5 5.5 -5.5 5.5 2 2 5.5 -5.5 5.5 5.5 2 -2 -5.5 -5.5 5.5 -5.5 -2 -2 -5.5 5.5 -5.5 -5.5z" },
    { label: "triangle", pattern: "M0 15L7.5 0L15 15Z" },
    { label: "square", pattern: "M0 0 H15 V15 H-15Z" },
    { label: "diamond", pattern: "M0 7.5 L7.5 15L15 7.5L7.5 0Z" },
  ],
  Maki: Object.entries(makiPaths).map(([key, value]) => ({ label: key, pattern: value })),
  Temaki: Object.entries(temakiPaths).map(([key, value]) => ({ label: key, pattern: value })),
};

export function getPathForMarker(markerName: string | undefined): string | undefined {
  if (!markerName?.length) {
    return undefined;
  }
  for (const groupKey of Object.keys(markersLibrary)) {
    const group = markersLibrary[groupKey];
    for (const marker of group) {
      if (marker.label === markerName) {
        return marker.pattern;
      }
    }
  }
  return undefined;
}

export const markersLibraryFlat = [
  ...markersLibrary.Points,
  ...markersLibrary.Arrows,
  ...markersLibrary.Pins,
  ...markersLibrary.Recreation,
  ...markersLibrary.Basic,
  ...markersLibrary.Maki,
  ...markersLibrary.Temaki,
];
