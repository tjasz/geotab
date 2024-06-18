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
  "marker-size"?: number;
  "marker-symbol"?: string;
  "marker-color"?: string;
  "marker-rotation"?: number;
};
const markerSizeToNumber = {
  small: 0.75,
  medium: 1,
  large: 2,
}
export function readSimpleStyle(f: Feature): SimpleStyle {
  let markerColor = getNonEmpty(f.properties?.["marker-color"]);
  if (markerColor !== undefined && markerColor?.charAt(0) !== "#") {
    markerColor = "#" + markerColor;
  }

  let markerSize = getNonEmpty(f.properties?.["marker-size"]);
  let markerSizeNumber: number | undefined = undefined;
  if (markerSize) {
    try {
      markerSizeNumber = Number(markerSize);
    } catch (error) {
      console.info("marker-size was not a number: " + markerSize);
      markerSizeNumber = markerSizeToNumber[markerSize];
    }
  }

  return {
    ...readPathCss(f.properties),
    title: getNonEmpty(f.properties?.["title"]),
    description: getNonEmpty(f.properties?.["description"]),
    "marker-size": markerSizeNumber,
    "marker-symbol": getNonEmpty(f.properties?.["marker-symbol"]),
    "marker-color": markerColor,
    "marker-rotation": getNonEmptyAsNumber(f.properties?.["marker-rotation"]),
  };
}

// merge several styles, passed in order of priority
export function mergeStyles<T extends {}>(a: T, b: T, c?: T, d?: T): T {
  const result = {};
  for (const key of Object.keys(a).concat(Object.keys(b).concat(Object.keys(c ?? {}).concat(Object.keys(d ?? {}))))) {
    result[key] = a[key] ?? b[key] ?? c?.[key] ?? d?.[key];
  }
  return result as T;
}

export type MarkerStyle = {
  symbol?: string,
  color?: string,
  size?: number,
  rotation?: number,
  opacity?: number,
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