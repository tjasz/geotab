import L from "leaflet";
import math from "./math";

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

// TODO reuse SvgPatternWithLabel
export const markersLibrary = {
  "Basic": [
    { label: "circle", pattern: "M0 7.5A7.5 7.5 0 0 0 15 7.5A7.5 7.5 0 1 0 0 7.5Z" },
    { label: "X", pattern: "M0 2l5.5 5.5 -5.5 5.5 2 2 5.5 -5.5 5.5 5.5 2 -2 -5.5 -5.5 5.5 -5.5 -2 -2 -5.5 5.5 -5.5 -5.5z" },
    { label: "triangle", pattern: "M0 15L7.5 0L15 15Z" },
    { label: "square", pattern: "M0 0 H15 V15 H-15Z" },
    { label: "diamond", pattern: "M0 7.5 L7.5 15L15 7.5L7.5 0Z" },
  ],
  "Maki": [
    { label: "aerialway", pattern: "M13,5H8V2.6c0.1854-0.1047,0.3325-0.2659,0.42-0.46L13.5,1.5C13.7761,1.5,14,1.2761,14,1s-0.2239-0.5-0.5-0.5L8.28,1.15&#xA;&#x9;C8.0954,0.9037,7.8077,0.7562,7.5,0.75C7.0963,0.752,6.7334,0.9966,6.58,1.37L1.5,2C1.2239,2,1,2.2239,1,2.5S1.2239,3,1.5,3&#xA;&#x9;l5.22-0.65C6.7967,2.4503,6.8917,2.5351,7,2.6V5H2C1.4477,5,1,5.4477,1,6v7c0,0.5523,0.4477,1,1,1h11c0.5523,0,1-0.4477,1-1V6&#xA;&#x9;C14,5.4477,13.5523,5,13,5z M7,11H3V7h4V11z M12,11H8V7h4V11z" },
    { label: "airfield", pattern: "M6.8182,0.6818H4.7727&#xA;&#x9;C4.0909,0.6818,4.0909,0,4.7727,0h5.4545c0.6818,0,0.6818,0.6818,0,0.6818H8.1818c0,0,0.8182,0.5909,0.8182,1.9545V4h6v2L9,8l-0.5,5&#xA;&#x9;l2.5,1.3182V15H4v-0.6818L6.5,13L6,8L0,6V4h6V2.6364C6,1.2727,6.8182,0.6818,6.8182,0.6818z" },
  ]
}