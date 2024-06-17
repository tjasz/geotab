import { Feature } from "../geojson-types";

export type SimpleStyle = {
  title?: string;
  description?: string;
  "marker-size"?: string; // "small" | "medium" | "large"
  "marker-symbol"?: string;
  "marker-color"?: string;
  stroke?: string;
  "stroke-opacity"?: number;
  "stroke-width"?: number;
  fill?: string;
  "fill-opacity"?: number;
}

export function getSimpleStyle(f: Feature): SimpleStyle {
  return {
    title: getNonEmpty(f.properties["title"]),
    description: getNonEmpty(f.properties["description"]),
    "marker-size": getNonEmpty(f.properties["marker-size"]),
    "marker-symbol": getNonEmpty(f.properties["marker-symbol"]),
    "marker-color": getNonEmpty(f.properties["marker-color"]),
    stroke: getNonEmpty(f.properties["stroke"]),
    "stroke-opacity": getNonEmptyTransformed(f.properties["stroke-opacity"], Number),
    "stroke-width": getNonEmptyTransformed(f.properties["stroke-width"], Number),
    fill: getNonEmpty(f.properties["fill"]),
    "fill-opacity": getNonEmptyTransformed(f.properties["fill-opacity"], Number),
  }
}

function getNonEmpty(s: string): string | undefined {
  return s?.trim().length ? s : undefined;
}

function getNonEmptyTransformed<T>(s: string, t: (s: string) => T): T | undefined {
  return s?.trim().length ? t(s) : undefined;
}