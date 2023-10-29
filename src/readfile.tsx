import Papa from 'papaparse';
import FitParser from 'fit-file-parser'
import gpxParser from './gpx-parser'
import { gapi } from 'gapi-script';
import * as GeoJson from './geojson-types'

export function attachProgress(proms:Promise<any>[], progress_cb:{(percentDone:number):void}) : void {
  let d = 0;
  progress_cb(0);
  for (const p of proms) {
    p.then(()=> {
      d ++;
      progress_cb( (d * 100) / proms.length );
    });
  }
}

export function parseFile(file:File) {
  return new Promise((resolve, reject) => {
    readFileAsText(file).then((text) => {
      // guess file type based on first character of text
      if (text[0] === '{') {
        // geoJSON
        try {
          resolve(JSON.parse(text));
        } catch (error) {
          reject(`Could not parse ${file.name} as GeoJSON: ${error instanceof Error ? error.message : JSON.stringify(error)}.`);
        }
      } else if (text[0] === '<') {
        // GPX
        try {
          const gpx = new gpxParser();
          gpx.parse(text).calculate();
          resolve(gpx.toGeoJSON());
        } catch (error) {
          reject(`Could not parse ${file.name} as GPX: ${error instanceof Error ? error.message : JSON.stringify(error)}.`);
        }
      } else if (text.charCodeAt(0) === 14 || text.charCodeAt(0) === 12) {
        // FIT
        try {
          readFileAsArrayBuffer(file).then((arraybuffer) => {
            try {
              const fit = new FitParser({force: true});
              fit.parse(arraybuffer, (error, data) => {
                if (error) {
                  reject(`Could not parse ${file.name} as .FIT: ${error instanceof Error ? error.message : JSON.stringify(error)}.`);
                } else {
                  resolve(fitToGeoJSON(data));
                }
              });
            } catch (error) {
              reject(`Could not parse ${file.name} as .FIT: ${error instanceof Error ? error.message : JSON.stringify(error)}.`);
            }
          })
        } catch (error) {
          reject(`Could not parse ${file.name} as .FIT: ${error instanceof Error ? error.message : JSON.stringify(error)}.`);
        }
      } else {
        // CSV
        try {
          resolve(csvToGeoJSON(text));
        } catch (error) {
          reject(`Could not parse ${file.name} as CSV: ${error instanceof Error ? error.message : JSON.stringify(error)}.`);
        }
      }
    })
  });
}

function getGoogleFile(file) {
  switch (file.mimeType) {
    case 'application/vnd.google-apps.spreadsheet':
      return gapi.client.drive.files
      .export({ fileId: file.id, mimeType: 'text/csv'});
    case 'application/json':
    case 'application/json+geotab':
    case 'text/csv':
    case 'application/gpx+xml':
    default:
      return gapi.client.drive.files
      .get({ fileId: file.id, alt: 'media'});
  }
}

// TODO reduce copypasta
export function parseGoogleFile(file) {
  return new Promise((resolve, reject) => {
    getGoogleFile(file)
      .then((res) => {
      const text = res.body;
      if (file.mimeType.startsWith('application/json')) {
        // geoJSON
        try {
          resolve(JSON.parse(text));
        } catch (error) {
          reject(`Could not parse ${file.name} as GeoJSON: ${error instanceof Error ? error.message : JSON.stringify(error)}.`);
        }
      } else if (file.mimeType === 'application/gpx+xml') {
        // GPX
        try {
          const gpx = new gpxParser();
          gpx.parse(text).calculate();
          resolve(gpx.toGeoJSON());
        } catch (error) {
          reject(`Could not parse ${file.name} as GPX: ${error instanceof Error ? error.message : JSON.stringify(error)}.`);
        }
      } // TODO .FIT compatability
      else {
        // CSV
        try {
          resolve(csvToGeoJSON(text));
        } catch (error) {
          reject(`Could not parse ${file.name} as CSV: ${error instanceof Error ? error.message : JSON.stringify(error)}.`);
        }
      }
    })
    .catch((e) => reject(JSON.stringify(e)))
  });
}

function readFileAsText(file:Blob) : Promise<string> {
  return new Promise((resolve, reject) => {
    let reader = new FileReader();
    reader.onload = () => { resolve(reader.result as string); };
    reader.onerror = reject;
    reader.readAsText(file);
  })
}

function readFileAsArrayBuffer(file:Blob) : Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    let reader = new FileReader();
    reader.onload = () => { resolve(reader.result as ArrayBuffer); };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  })
}

function fitToGeoJSON(fit) : GeoJson.FeatureCollection {
  let GeoJSON:GeoJson.FeatureCollection = {
    type: GeoJson.FeatureType.FeatureCollection,
    features: []
  };

  // parse a singular track from the .FIT file
  const track:GeoJson.Feature = {
    type: GeoJson.FeatureType.Feature,
    geometry: {
      type: GeoJson.GeometryType.LineString,
      coordinates: []
    },
    properties: {}
  }
  // TODO can there be multiple sessions?
  if (fit.sessions[0] !== undefined) {
    const session = fit.sessions[0];
    track.properties.sport = session.sport;
    track.properties.startTime = session.start_time.getTime();
    track.properties.duration = session.total_elapsed_time;
    track.properties.distance = session.total_distance;
    track.properties.calories = session.total_calories;
  }
  let lastElev = null;
  for (let i = 0; i < fit.records.length; i++) {
    const record = fit.records[i];
    if (record.altitude) {
      if (track.properties.minElevation === undefined || record.altitude < track.properties.minElevation) {
        track.properties.minElevation = record.altitude;
      }
      if (track.properties.maxElevation === undefined || record.altitude > track.properties.maxElevation) {
        track.properties.maxElevation = record.altitude;
      }
      if (lastElev) {
        const change = record.altitude - lastElev;
        if (change > 0) {
          track.properties.gain = track.properties.gain ? track.properties.gain + change : change;
        } else {
          track.properties.loss = track.properties.loss ? track.properties.loss - change : -change;
        }
      }
      lastElev = record.altitude;
    }
    if (record.position_lat !== undefined && record.position_long !== undefined) {
      track.geometry.coordinates.push([record.position_long, record.position_lat])
    }
  }
  GeoJSON.features.push(track);

  return GeoJSON;
}

function csvToGeoJSON(csvString:string) : GeoJson.FeatureCollection {
  const parseResult = Papa.parse(csvString, {delimiter: ",", header: true, dynamicTyping: false, skipEmptyLines: true});
  const latfield = getLatField(parseResult.meta.fields);
  const lonfield = getLonField(parseResult.meta.fields);
  // TODO allow manual specification of lat/lon fields
  // TODO handle non-number lat/lon formats like DMS
  if (!latfield) throw Error(`Expected latitude field. Found ${parseResult.meta.fields}.`);
  if (!lonfield) throw Error(`Expected longitude field. Found ${parseResult.meta.fields}.`);

  return {
    type: GeoJson.FeatureType.FeatureCollection,
    features: parseResult.data.map((row) =>
      { return {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [row[lonfield], row[latfield]],
        },
        properties: row,
      }}
    )
  };
}

function getLatField(fields:string[]) : string|undefined {
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

function getLonField(fields:string[]) : string|undefined {
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