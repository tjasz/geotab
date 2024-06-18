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
  return svgArray.map(xmlString => {
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
    return { label: id ?? "undefined", pattern: d };
  })
}

const makiPaths = fromSvgArray(svgArray)
const temakiPaths = fromSvgArray(temakiSvgArray)
// TODO reuse SvgPatternWithLabel
export const markersLibrary = {
  Basic: [
    { label: "circle", pattern: "M0 7.5A7.5 7.5 0 0 0 15 7.5A7.5 7.5 0 1 0 0 7.5Z" },
    { label: "X", pattern: "M0 2l5.5 5.5 -5.5 5.5 2 2 5.5 -5.5 5.5 5.5 2 -2 -5.5 -5.5 5.5 -5.5 -2 -2 -5.5 5.5 -5.5 -5.5z" },
    { label: "triangle", pattern: "M0 15L7.5 0L15 15Z" },
    { label: "square", pattern: "M0 0 H15 V15 H-15Z" },
    { label: "diamond", pattern: "M0 7.5 L7.5 15L15 7.5L7.5 0Z" },
  ],
  Maki: makiPaths,
  Temaki: temakiPaths,
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
  ...markersLibrary.Basic,
  ...markersLibrary.Maki,
  ...markersLibrary.Temaki,
];
