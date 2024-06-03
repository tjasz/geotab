import Papa from "papaparse";
import { featureCollection, FeatureCollection, point } from "@turf/turf";

enum InvalidPositionHandling {
  Throw,
  SkipRow,
  ReplaceWithNull,
};

type ICsvToGeoJsonOptions = {
  delimiter?: string;
  latitudeField?: string;
  longitudeField?: string;
  parseLatLon?: (string) => number;
  invalidPositionHandling?: InvalidPositionHandling;
};

export function csvToGeoJSON(csvString: string, options?: ICsvToGeoJsonOptions): FeatureCollection {
  const parseResult = Papa.parse(csvString, {
    delimiter: options?.delimiter ?? ",",
    header: true,
    dynamicTyping: false,
    skipEmptyLines: true,
  });

  // Get latitude and longitude fields
  const latfield = options?.latitudeField ?? findField(parseResult.meta.fields, ["latitude", "lat"]);
  const lonfield = options?.latitudeField ?? findField(parseResult.meta.fields, ["longitude", "lon", "lng"]);
  if (!latfield) {
    throw Error(`Expected latitude field. Found ${parseResult.meta.fields}.`);
  }
  if (!lonfield) {
    throw Error(`Expected longitude field. Found ${parseResult.meta.fields}.`);
  }

  const parseLatLng = options?.parseLatLon ?? parseFloat;
  const invalidPositionHandling = options?.invalidPositionHandling ?? InvalidPositionHandling.ReplaceWithNull;

  return featureCollection(parseResult.data.map((row) => {
    const lat = parseLatLng(row[latfield]);
    const lon = parseLatLng(row[lonfield]);

    const latValidation = validateNumber(lat, 90, -90);
    const lonValidation = validateNumber(lon, 180, -180);

    if (invalidPositionHandling === InvalidPositionHandling.Throw) {
      if (!latValidation[0]) {
        throw Error(`Invalid latitude - ${latValidation[1]} : ${row[latfield]}`)
      }
      if (!lonValidation[0]) {
        throw Error(`Invalid longitude - ${lonValidation[1]} : ${row[lonfield]}`)
      }
    }

    if (
      invalidPositionHandling === InvalidPositionHandling.ReplaceWithNull ||
      invalidPositionHandling === InvalidPositionHandling.SkipRow
    ) {
      return {
        type: "Point",
        geometry: null,
        properties: row,
      };
    }

    return point([lon, lat], row);
  })
    .filter(f => !(invalidPositionHandling === InvalidPositionHandling.SkipRow && f.geometry === null))
  );
}

// Find a field that either matches, starts with, or includes one of the preferred names,
// in order of preference.
function findField(fields: string[], preferredNames: string[]): string | undefined {
  for (const name of preferredNames) {
    const field = fields.find((f) => f.toLowerCase() === name) ??
      fields.find((f) => f.toLowerCase().startsWith(name)) ??
      fields.find((f) => f.toLowerCase().includes(name));
    if (field) {
      return field;
    }
  }
  return undefined;
}

function validateNumber(val: number, max: number, min: number): [boolean, string?] {
  if (isNaN(val)) {
    return [false, "not a number"]
  }
  if (val > max) {
    return [false, `cannot exceed ${max}`];
  }
  if (val < min) {
    return [false, `cannot be less than ${min}`];
  }
  return [true];
}
