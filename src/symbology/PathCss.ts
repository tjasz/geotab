import { Feature } from "../geojson-types";

export type PathCss = {
  stroke?: string;
  "stroke-opacity"?: number;
  "stroke-width"?: number;
  "stroke-linecap"?: string;
  "stroke-linejoin"?: string;
  "stroke-dasharray"?: string;
  "stroke-dashoffset"?: string;
  fill?: string;
  "fill-opacity"?: number;
  "fill-rule"?: string;
}

function readPathCss(o: Object): PathCss {
  return {
    stroke: getNonEmpty(o?.["stroke"]),
    "stroke-opacity": getNonEmptyAsNumber(o?.["stroke-opacity"]),
    "stroke-width": getNonEmptyAsNumber(o?.["stroke-width"]),
    "stroke-linecap": getNonEmpty(o?.["stroke-linecap"]),
    "stroke-linejoin": getNonEmpty(o?.["stroke-linejoin"]),
    "stroke-dasharray": getNonEmpty(o?.["stroke-dasharray"]),
    "stroke-dashoffset": getNonEmpty(o?.["stroke-dashoffset"]),
    fill: getNonEmpty(o?.["fill"]),
    "fill-opacity": getNonEmptyAsNumber(o?.["fill-opacity"]),
    "fill-rule": getNonEmpty(o?.["fill-rule"]),
  }
}

export function readGeoJsonCss(f: Feature): PathCss {
  return readPathCss(f.style);
}

type SimpleStyle = PathCss & {
  title?: string;
  description?: string;
  "marker-size"?: string;
  "marker-symbol"?: string;
  "marker-color"?: string;
};
export function readSimpleStyle(f: Feature): SimpleStyle {
  let markerColor = getNonEmpty(f.properties?.["marker-color"]);
  if (markerColor?.charAt(0) !== "#") {
    markerColor = "#" + markerColor;
  }
  return {
    ...readPathCss(f.properties),
    title: getNonEmpty(f.properties?.["title"]),
    description: getNonEmpty(f.properties?.["description"]),
    "marker-size": getNonEmpty(f.properties?.["marker-size"]),
    "marker-symbol": getNonEmpty(f.properties?.["marker-symbol"]),
    "marker-color": markerColor,
  };
}

// merge several styles, passed in order of priority
export function mergeStyles(a: PathCss, b: PathCss, c?: PathCss, d?: PathCss): PathCss {
  const result: PathCss = {};
  for (const key of [
    "stroke",
    "stroke-opacity",
    "stroke-width",
    "stroke-linecap",
    "stroke-linejoin",
    "stroke-dasharray",
    "stroke-dashoffset",
    "fill",
    "fill-opacity",
    "fill-rule"
  ]) {
    result[key] = a[key] ?? b[key] ?? c?.[key] ?? d?.[key];
  }
  return result;
}

function getNonEmpty(s: string): string | undefined {
  return s?.trim().length ? s : undefined;
}

function getNonEmptyAsNumber(s: string): number | undefined {
  if (typeof s === "number") {
    return s;
  }
  return s?.trim().length ? Number(s) : undefined;
}