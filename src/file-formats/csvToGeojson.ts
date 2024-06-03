import Papa from "papaparse";
import * as GeoJson from "../geojson-types";

export function csvToGeoJSON(csvString: string): GeoJson.FeatureCollection {
  const parseResult = Papa.parse(csvString, {
    delimiter: ",",
    header: true,
    dynamicTyping: false,
    skipEmptyLines: true,
  });
  const latfield = getLatField(parseResult.meta.fields);
  const lonfield = getLonField(parseResult.meta.fields);
  // TODO allow manual specification of lat/lon fields
  // TODO handle non-number lat/lon formats like DMS
  if (!latfield)
    throw Error(`Expected latitude field. Found ${parseResult.meta.fields}.`);
  if (!lonfield)
    throw Error(`Expected longitude field. Found ${parseResult.meta.fields}.`);

  return {
    type: GeoJson.FeatureType.FeatureCollection,
    features: parseResult.data.map((row) => {
      const lat = parseFloat(row[latfield]);
      const lon = parseFloat(row[lonfield]);
      const geometry =
        isNaN(lat) || isNaN(lon)
          ? null
          : {
            type: "Point",
            coordinates: [lon, lat],
          };
      return {
        type: "Feature",
        geometry,
        properties: row,
      };
    }),
  };
}

function getLatField(fields: string[]): string | undefined {
  let latfield = fields.find((f) => f.toLowerCase() === "latitude");
  if (latfield) return latfield;

  latfield = fields.find((f) => f.toLowerCase().startsWith("latitude"));
  if (latfield) return latfield;

  latfield = fields.find((f) => f.toLowerCase().includes("latitude"));
  if (latfield) return latfield;

  latfield = fields.find((f) => f.toLowerCase() === "lat");
  if (latfield) return latfield;

  latfield = fields.find((f) => f.toLowerCase().startsWith("lat"));
  if (latfield) return latfield;

  latfield = fields.find((f) => f.toLowerCase().includes("lat"));
  return latfield;
}

function getLonField(fields: string[]): string | undefined {
  let lonfield = fields.find((f) => f.toLowerCase() === "longitude");
  if (lonfield) return lonfield;

  lonfield = fields.find((f) => f.toLowerCase().startsWith("longitude"));
  if (lonfield) return lonfield;

  lonfield = fields.find((f) => f.toLowerCase().includes("longitude"));
  if (lonfield) return lonfield;

  lonfield = fields.find((f) => f.toLowerCase() === "lon");
  if (lonfield) return lonfield;

  lonfield = fields.find((f) => f.toLowerCase().startsWith("lon"));
  if (lonfield) return lonfield;

  lonfield = fields.find((f) => f.toLowerCase().includes("lon"));
  return lonfield;
}
