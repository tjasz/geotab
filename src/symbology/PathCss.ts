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

export function readGeoJsonCss(f: Feature): PathCss {
  return {
    stroke: getNonEmpty(f.style?.["stroke"]),
    "stroke-opacity": getNonEmptyTransformed(f.style?.["stroke-opacity"], Number),
    "stroke-width": getNonEmptyTransformed(f.style?.["stroke-width"], Number),
    "stroke-linecap": getNonEmpty(f.style?.["stroke-linecap"]),
    "stroke-linejoin": getNonEmpty(f.style?.["stroke-linejoin"]),
    "stroke-dasharray": getNonEmpty(f.style?.["stroke-dasharray"]),
    "stroke-dashoffset": getNonEmpty(f.style?.["stroke-dashoffset"]),
    fill: getNonEmpty(f.style?.["fill"]),
    "fill-opacity": getNonEmptyTransformed(f.style?.["fill-opacity"], Number),
    "fill-rule": getNonEmpty(f.style?.["fill-rule"]),
  }
}

export function readSimpleStyle(f: Feature): PathCss {
  return {
    // TODO get the non-CSS properties from SimpleStyle
    // title: getNonEmpty(f.properties["title"]),
    // description: getNonEmpty(f.properties["description"]),
    // "marker-size": getNonEmpty(f.properties["marker-size"]),
    // "marker-symbol": getNonEmpty(f.properties["marker-symbol"]),
    // "marker-color": getNonEmpty(f.properties["marker-color"]),
    stroke: getNonEmpty(f.properties["stroke"]),
    "stroke-opacity": getNonEmptyTransformed(f.properties["stroke-opacity"], Number),
    "stroke-width": getNonEmptyTransformed(f.properties["stroke-width"], Number),
    fill: getNonEmpty(f.properties["fill"]),
    "fill-opacity": getNonEmptyTransformed(f.properties["fill-opacity"], Number),
  }
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

function getNonEmptyTransformed<T>(s: string, t: (s: string) => T): T | undefined {
  return s?.trim().length ? t(s) : undefined;
}