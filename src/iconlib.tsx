import L from "leaflet";
import math from "./math";
import Svg from "./PatternRenderer/Svg";
import { makiPaths, temakiPaths } from "./iconPaths";
import { makiCompatibility } from "./maki-compatibility";

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

// function used to make maki and temaki icons more regular (fit in 15x15 viewbox)
// run the "build" command in the maki library to generate an svgArray
// which can be passed here.
// run it with modifications to read from the temaki icons to pass that in as well.
function fromSvgArray(svgArray: string[]) {
  const result = Object.fromEntries(svgArray.map(xmlString => {
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
      const [viewBoxX, viewBoxY, viewBoxWidth, viewBoxHeight] = viewBox.split(" ").map(Number);
      const scaleBy = 15 / Math.max(viewBoxWidth, viewBoxHeight);
      let translateBy = [0, 0];
      if (Math.abs(viewBoxWidth - viewBoxHeight) > 0.01) {
        if (viewBoxWidth < viewBoxHeight) {
          translateBy[0] = (viewBoxHeight - viewBoxWidth) / 2;
        } else {
          console.error(`Non-square viewBox for ${id} is wider than it is tall : ${svg.getAttribute("viewBox")}`)
        }
      }
      if (viewBoxX || viewBoxY) {
        console.error(`viewBox does not start at origin for ${id} : ${svg.getAttribute("viewBox")}`)
      }
      d = Svg.toString(Svg.round(Svg.scale(Svg.translate(Svg.parse(d), translateBy[0], translateBy[1]), scaleBy), 3));
    }
    return [id ?? "undefined", d];
  }))
  console.log(result)
  return result;
}
// const makiPaths = fromSvgArray(svgArray)
// const temakiPaths = fromSvgArray(temakiSvgArray)

// TODO reuse SvgPatternWithLabel
export const markersLibrary = {
  Points: [
    { label: "circle", pattern: makiPaths.circle },
    { label: "ring", pattern: makiPaths["circle-stroked"] },
    { label: "pin", pattern: temakiPaths["temaki-pin"] },
  ],
  "Natural Features": [
    { label: "wetland", pattern: makiPaths.wetland },
    { label: "waterfall", pattern: makiPaths.waterfall },
    { label: "peak", pattern: makiPaths.mountain },
    { label: "rockfall", pattern: temakiPaths["temaki-cliff_falling_rocks"] },
    { label: "tree", pattern: temakiPaths["temaki-tree_needleleaved"] },
    { label: "flame", pattern: makiPaths["fire-station"] },
  ],
  Structures: [
    { label: "hut", pattern: temakiPaths["temaki-hut"] },
    { label: "lodging", pattern: makiPaths.lodging },
    { label: "shelter", pattern: makiPaths.shelter },
    { label: "sleep shelter", pattern: temakiPaths["temaki-sleep_shelter"] },
    { label: "picnic shelter", pattern: temakiPaths["temaki-picnic_shelter"] },
    { label: "picnic table", pattern: makiPaths["picnic-site"] },
    { label: "tent", pattern: makiPaths.campsite },
    { label: "radio tower", pattern: makiPaths["communications-tower"] },
    { label: "fire lookout", pattern: makiPaths["observation-tower"] },
    { label: "lighthouse", pattern: makiPaths.lighthouse },
    { label: "ranger station", pattern: makiPaths["ranger-station"] },
    { label: "gate", pattern: temakiPaths["temaki-gate"] },
    { label: "fuel pump", pattern: makiPaths.fuel },
    { label: "trash can", pattern: makiPaths["waste-basket"] },
    { label: "campfire", pattern: temakiPaths["temaki-campfire"] },
  ],
  Vehicles: [
    { label: "car", pattern: makiPaths.car },
    { label: "bus", pattern: makiPaths.bus },
    { label: "rv", pattern: temakiPaths["temaki-camper_trailer"] },
    { label: "aerial tram", pattern: makiPaths.aerialway },
    { label: "airplane", pattern: makiPaths.airport },
  ],
  "Winter Sports": [
    { label: "sledding", pattern: temakiPaths["temaki-sledding"] },
    { label: "snowshoeing", pattern: temakiPaths["temaki-snow_shoeing"] },
    { label: "iceskating", pattern: temakiPaths["temaki-ice_skating"] },
    { label: "cross-country skiing", pattern: temakiPaths["temaki-cross_country_skiing"] },
    { label: "downhill skiing", pattern: makiPaths.skiing },
    { label: "snowboarding", pattern: temakiPaths["temaki-snowboarding"] },
    { label: "chairlift", pattern: temakiPaths["temaki-chairlift"] },
    { label: "snowmobiling", pattern: temakiPaths["temaki-snowmobile"] },
  ],
  "Water Sports": [
    { label: "canoeing-1", pattern: temakiPaths["temaki-canoe"] },
    { label: "river-rafting", pattern: temakiPaths["temaki-rafting"] },
    { label: "sailing", pattern: temakiPaths["temaki-sailing"] },
    { label: "windsurfing", pattern: temakiPaths["temaki-wind_surfing"] },
    { label: "personal-watercraft", pattern: temakiPaths["temaki-jet_skiing"] },
    { label: "swimming", pattern: makiPaths.swimming },
    { label: "surfing", pattern: temakiPaths["temaki-surfing"] },
    { label: "diving", pattern: temakiPaths["temaki-diving"] },
    { label: "beach", pattern: makiPaths.beach },
    { label: "fishing", pattern: temakiPaths["temaki-fishing_pier"] },
    { label: "kayaking", pattern: temakiPaths["temaki-kayaking"] },
    { label: "boatlaunch", pattern: temakiPaths["temaki-boat_ramp"] },
  ],
  "Other Sports": [
    { label: "golf", pattern: makiPaths.golf },
    { label: "bicycling", pattern: makiPaths.bicycle },
    { label: "scrambling", pattern: temakiPaths["temaki-climbing"] },
    { label: "climbing", pattern: temakiPaths["temaki-abseiling"] },
    { label: "hanggliding", pattern: temakiPaths["temaki-hang_gliding"] },
    { label: "horseback riding", pattern: makiPaths["horse-riding"] },
  ],
  Other: [
    { label: "photo", pattern: makiPaths.attraction },
    { label: "anchorage", pattern: makiPaths.harbor },
    { label: "drinking-water", pattern: makiPaths["drinking-water"] },
    { label: "phone", pattern: makiPaths.telephone },
    { label: "shower", pattern: temakiPaths["temaki-shower"] },
    { label: "firstaidplus", pattern: temakiPaths["temaki-briefcase_cross"] },
    { label: "binoc", pattern: temakiPaths["temaki-binoculars"] },
    { label: "info", pattern: makiPaths.information },
    { label: "danger", pattern: makiPaths.danger },
    { label: "atm", pattern: temakiPaths["temaki-atm2"] },
    { label: "construction", pattern: makiPaths.construction },
    { label: "dogs-offleash", pattern: makiPaths["dog-park"] },
    { label: "electric-hookup", pattern: temakiPaths["temaki-electronic"] },
    { label: "electric-charging", pattern: makiPaths["charging-station"] },
    { label: "foodservice", pattern: makiPaths.restaurant },
    { label: "wheelchair", pattern: makiPaths.wheelchair },
    { label: "low-vision-access", pattern: temakiPaths["temaki-blind"] },
    { label: "recycling", pattern: makiPaths.recycling },
  ],
  Maki: Object.entries(makiPaths).map(([key, value]) => ({ label: key, pattern: value })),
  Temaki: Object.entries(temakiPaths).map(([key, value]) => ({ label: key, pattern: value })),
};

export function getPathForMarker(markerName: string | undefined): string | undefined {
  if (!markerName?.length) {
    return undefined;
  }
  if (markerName !== undefined && !(markerName in makiPaths || markerName in temakiPaths)) {
    markerName = makiCompatibility.find(i => i.compatible === markerName)?.maki;
  }
  if (!markerName?.length) {
    return undefined;
  }
  return makiPaths[markerName] ?? temakiPaths[markerName];
}
