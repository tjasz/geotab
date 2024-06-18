import { getPathForMarker, markersLibrary, StarMarker, SvgPathMarker } from "./iconlib";
import { toType } from "./fieldtype";
import * as GeoJson from "./geojson-types";
import { FieldTypeDescription } from "./fieldtype";
import { mergeStyles, readSimpleStyle, readGeoJsonCss, PathCss } from "./symbology/PathCss";

export enum SymbologyMode {
  ByValue = "byvalue",
  Discrete = "discrete",
  Continuous = "continuous",
}

type ModeDefinition = {
  name: SymbologyMode;
  types: Set<string>;
  interpolation: {
    (definition: SymbologyProperty<any>, feature: GeoJson.Feature): number;
  };
  minimumValues: number;
  numBreaks: { (numValues: number): number };
};

export type SymbologyProperty<T> = {
  mode: SymbologyMode;
  values: T[];
  fieldname: string;
  breaks: any[];
  default: T;
  type: FieldTypeDescription;
};

export type Symbology = {
  [index: string]: SymbologyProperty<any>;
};

export const symbologyModes: { [index in SymbologyMode]: ModeDefinition } = {
  [SymbologyMode.ByValue]: {
    name: SymbologyMode.ByValue,
    types: new Set(["string", "number", "date"]),
    interpolation: byvalueInterpolation,
    minimumValues: 0,
    numBreaks: (numValues) => numValues,
  },
  [SymbologyMode.Discrete]: {
    name: SymbologyMode.Discrete,
    types: new Set(["string", "number", "date"]),
    interpolation: discreteInterpolation,
    minimumValues: 1,
    numBreaks: (numValues) => numValues - 1,
  },
  [SymbologyMode.Continuous]: {
    name: SymbologyMode.Continuous,
    types: new Set(["number", "date"]),
    interpolation: continuousInterpolation,
    minimumValues: 2,
    numBreaks: (numValues) => numValues,
  },
};

export function modesForType(type): ModeDefinition[] {
  return Object.values(symbologyModes).filter((m) => m.types.has(type));
}

function findIndex<T>(array: T[], value: T): number {
  // set i to the index where value is first greater than array[i]
  let i = 0;
  for (; i < array.length; i++) {
    // TODO binary search?
    if (value < array[i]) {
      break;
    }
  }
  return i;
}

function byvalueInterpolation<T>(
  definition: SymbologyProperty<T>,
  feature: GeoJson.Feature,
): T {
  // return the value from "values" with the same index where the feature value is equal to the "breaks"
  if (definition.values.length !== definition.breaks.length) {
    throw Error(
      `ByValue Symbology.values should have the same number of values as Symbology.breaks. Values: ${definition.values}; Breaks: ${definition.breaks}.`,
    );
  }
  const value = toType(
    feature.properties[definition.fieldname],
    definition.type,
  );
  // set i to the index where the feature value is equal to the break value
  let i = definition.breaks.findIndex((b) => b === value);
  return i === -1 ? definition.default : definition.values[i];
}

function discreteInterpolation<T>(
  definition: SymbologyProperty<T>,
  feature: GeoJson.Feature,
): T {
  if (definition.values.length !== definition.breaks.length + 1) {
    throw Error(
      `Discrete Symbology.values should have 1 more value than Symbology.breaks. Values: ${definition.values}; Breaks: ${definition.breaks}.`,
    );
  }
  if (definition.breaks.length === 0) return definition.values[0];
  const value = toType(
    feature.properties[definition.fieldname],
    definition.type,
  );
  // set i to the index where the feature value is first greater than the break value
  let i = findIndex(definition.breaks, value);
  return definition.values[i];
}

function linearInterpolation(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  x: number,
): number {
  return ((y1 - y0) * (x - x0)) / (x1 - x0) + y0;
}

function continuousInterpolation(
  definition: SymbologyProperty<number>,
  feature: GeoJson.Feature,
): number {
  if (definition.values.length < 2) {
    return definition.values[0];
  }
  if (definition.values.length !== definition.breaks.length) {
    throw Error(
      `Continuous Symbology.values should have the same number of values as Symbology.breaks. Values: ${definition.values}; Breaks: ${definition.breaks}.`,
    );
  }
  if (definition.breaks.length === 0) return definition.values[0];
  const value = toType(
    feature.properties[definition.fieldname],
    definition.type,
  );
  // set i to the index where the feature value is first greater than the break value
  let i = findIndex(definition.breaks, value);
  if (i < 1) {
    return definition.values[i];
  } else if (i >= definition.breaks.length) {
    return definition.values[definition.values.length - 1];
  }
  return linearInterpolation(
    definition.breaks[i - 1],
    definition.values[i - 1],
    definition.breaks[i],
    definition.values[i],
    value,
  );
}

// TODO handle different types
function interpolation(definition, feature: GeoJson.Feature) {
  if (definition === undefined) {
    return undefined;
  }
  if (
    (feature.properties[definition.fieldname] === undefined ||
      feature.properties[definition.fieldname] === "") &&
    definition.default
  ) {
    return definition.default;
  }
  const mode = symbologyModes[definition.mode];
  if (undefined === mode) {
    throw Error(
      `Symbology.mode: Found ${definition.mode}. Expected one of ${Object.keys(symbologyModes)}.`,
    );
  }
  if ("function" !== typeof mode.interpolation) {
    throw Error(
      `Symbology.mode: Interpolation function not defined for mode ${definition.mode}.`,
    );
  }
  return symbologyModes[definition.mode].interpolation(definition, feature);
}

export function painter(symbology) {
  // example symbology: {
  //   "hue": {mode: "discrete", values: [150, 250], fieldname: "elevation", breaks: [10000], default: 209},
  // },
  const fn = (feature, latlng) => {
    const simpleStyle = readSimpleStyle(feature);

    // get GeoJSON+CSS style
    const geoJsonCssStyle = readGeoJsonCss(feature);

    // calculate a style based on the symbology definitions
    const hue = interpolation(symbology?.hue, feature);
    const sat = interpolation(symbology?.saturation, feature);
    const light = interpolation(symbology?.lightness, feature);
    const opacity = interpolation(symbology?.opacity, feature);
    // stroke color is defined if one of hue, saturation, or lightness is defined
    const color = (hue !== undefined || sat !== undefined || light !== undefined)
      ? `hsl(${hue ?? 209}, ${sat ?? 50}%, ${light ?? 40}%)`
      : undefined;
    const size = interpolation(symbology?.size, feature);
    const calculatedStyle: PathCss = {
      stroke: color,
      "stroke-opacity": opacity,
      "stroke-width": size,
    }

    const defaultStyle: PathCss = {
      stroke: "#336899",
      "stroke-opacity": 1,
      "stroke-width": 4,
    };

    // In order of priority:
    // SimpleStyle is easily editable by the user on individual features.
    // The calculated style is also editable by the user, but not on individual features.
    // The GeoJSON+CSS style is not currently editable by the user in the UI.
    // The default style is not editable by the user.
    const style = mergeStyles(simpleStyle, calculatedStyle, geoJsonCssStyle, defaultStyle);

    if (feature.geometry?.type === "Point") {
      // TODO use the following from SimpleStyle:
      // marker-size, marker-symbol, marker-color
      // TODO get and use additional CalTopo properties that aren't in SimpleStyle:
      // marker-rotation, marker-size as an integer
      // TODO allow URL in "marker-symbol"?
      const shape = interpolation(symbology?.shape, feature) ?? 3; // TODO retire shape symbology?
      const markerColor = `hsla(${hue ?? 209}, ${sat ?? 50}%, ${light ?? 40}%, ${opacity ?? 1})`;
      const markerPath = getPathForMarker(simpleStyle["marker-symbol"])
        ?? interpolation(symbology?.markerSymbol, feature)?.pattern
        ?? markersLibrary.Basic[0].pattern;
      return SvgPathMarker(latlng, markerPath, markerColor, undefined, size ?? 15, size ?? 15);
    } else {
      return {
        stroke: style.stroke !== "none",
        color: style.stroke,
        weight: style["stroke-width"],
        opacity: style["stroke-opacity"],
        lineCap: style["stroke-linecap"],
        lineJoin: style["stroke-linejoin"],
        dashArray: style["stroke-dasharray"],
        dashOffset: style["stroke-dashoffset"],
        // let "fill" boolean default based on whether feature is a polygon
        fillColor: style.fill,
        fillOpacity: style["fill-opacity"] ?? 0.5 * (style["stroke-opacity"] ?? 1),
        fillRule: style["fill-rule"],
        pattern: feature.properties["pattern"] ?? interpolation(symbology?.linePattern, feature) ?? "solid",
        // TODO there's also the option to pass "classsName", but it is left out for now
      };
    }
  };
  return fn;
}
