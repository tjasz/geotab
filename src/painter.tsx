import { StarMarker } from "./iconlib";
import { toType } from "./fieldtype";
import * as GeoJson from "./geojson-types";
import { FieldTypeDescription } from "./fieldtype";

enum SymbologyMode {
  ByValue = "byvalue",
  Discrete = "discrete",
  Continuous = "continuous",
}

type ModeDefinition = {
  name: string;
  types: Set<string>;
  interpolation: {
    (definition: SymbologyProperty, feature: GeoJson.Feature): number;
  };
  minimumValues: number;
  numBreaks: { (numValues: number): number };
};

type SymbologyProperty = {
  mode: SymbologyMode;
  values: number[];
  fieldname: string;
  breaks: any[];
  default: number;
  type: FieldTypeDescription;
};

export type Symbology = {
  [index: string]: SymbologyProperty;
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

function byvalueInterpolation(
  definition: SymbologyProperty,
  feature: GeoJson.Feature,
): number {
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

function discreteInterpolation(
  definition: SymbologyProperty,
  feature: GeoJson.Feature,
): number {
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
  definition: SymbologyProperty,
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
    // get color-related attributes
    const hue = interpolation(symbology?.hue, feature) ?? 209;
    const sat = interpolation(symbology?.saturation, feature) ?? 50;
    const light = interpolation(symbology?.lightness, feature) ?? 40;
    const opacity = interpolation(symbology?.opacity, feature) ?? 1;
    const color = `hsla(${hue}, ${sat}%, ${light}%, ${opacity})`;
    // get other attributes
    const size = interpolation(symbology?.size, feature) ?? 5;
    const shape = interpolation(symbology?.shape, feature) ?? 3;
    const linePattern = interpolation(symbology?.linePattern, feature);

    if (feature.geometry?.type === "Point") {
      return StarMarker(latlng, Math.round(shape), size, color);
    } else {
      // TODO lineCap, lineJoin, dashArray, dashOffset, fillColor, fillOpacity, fillRule, fill boolean, stroke boolean
      let dashArray = "";
      if (feature.properties["pattern"]) {
        switch (feature.properties["pattern"]) {
          default:
          case "solid":
            dashArray = "";
            break;
          case "M0 -1 L0 1,,8,F": // dot
            dashArray = `${size} ${2 * size}`;
            break;
          case "M0 -3 L0 3,,12,F": // dash
            dashArray = `${4 * size} ${2 * size}`;
            break;
          case "M0 -3 L0 3,0,16,F;M0 -1L0 0,8,16": // dashdot
            dashArray = `${4 * size} ${2 * size} ${size} ${2 * size}`;
            break;
        }
      }
      const lineCap = "butt";
      const fillColor = feature.properties["fill"] ?? color;
      const fillOpacity = feature.properties["fill-opacity"] ?? 0.4;
      return {
        color,
        weight: size,
        dashArray,
        lineCap,
        fillColor,
        fillOpacity,
        pattern: linePattern ?? feature.properties["pattern"] ?? "solid",
      };
    }
  };
  return fn;
}
