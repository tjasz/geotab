import Papa from 'papaparse';
import FitParser from 'fit-file-parser'
import gpxParser from './gpx-parser.js'

export function attachProgress(proms, progress_cb) {
  let d = 0;
  progress_cb(0);
  for (const p of proms) {
    p.then(()=> {
      d ++;
      progress_cb( (d * 100) / proms.length );
    });
  }
}

export function parseFile(file) {
  return new Promise((resolve, reject) => {
    readFileAsText(file).then((text) => {
      // guess file type based on first character of text
      if (text[0] === '{') {
        // geoJSON
        try {
          resolve(JSON.parse(text));
        } catch (error) {
          reject(`Could not parse ${file.name} as GeoJSON: ${error.message}.`);
        }
      } else if (text[0] === '<') {
        // GPX
        try {
          const gpx = new gpxParser();
          gpx.parse(text).calculate();
          resolve(gpx.toGeoJSON());
        } catch (error) {
          reject(`Could not parse ${file.name} as GPX: ${error.message}.`);
        }
      } else if (text.charCodeAt(0) === 14 || text.charCodeAt(0) === 12) {
        // FIT
        try {
          readFileAsArrayBuffer(file).then((arraybuffer) => {
            try {
              const fit = new FitParser({force: false});
              fit.parse(arraybuffer, (error, data) => {
                if (error) {
                  reject(`Could not parse ${file.name} as .FIT: ${error.message}.`);
                } else {
                  resolve(fitToGeoJSON(data));
                }
              });
            } catch (error) {
              reject(`Could not parse ${file.name} as .FIT: ${error.message}.`);
            }
          })
        } catch (error) {
          reject(`Could not parse ${file.name} as .FIT: ${error.message}.`);
        }
      } else {
        // CSV
        try {
          resolve(csvToGeoJSON(text));
        } catch (error) {
          reject(`Could not parse ${file.name} as CSV: ${error.message}.`);
        }
      }
    })
  });
}

function readFileAsText(fname) {
  return new Promise((resolve, reject) => {
    let reader = new FileReader();
    reader.onload = () => { resolve(reader.result); };
    reader.onerror = reject;
    reader.readAsText(fname);
  })
}

function readFileAsArrayBuffer(fname) {
  return new Promise((resolve, reject) => {
    let reader = new FileReader();
    reader.onload = () => { resolve(reader.result); };
    reader.onerror = reject;
    reader.readAsArrayBuffer(fname);
  })
}

function fitToGeoJSON(fit) {
  console.log(fit)
  let GeoJSON = {
    type: "FeatureCollection",
    features: []
  };

  // parse a singular track from the .FIT file
  const track = {
    type: "Feature",
    geometry: {
      type: "LineString",
      coordinates: []
    },
    properties: { startTime: fit.activity.timestamp?.getTime() }
  }
  for (let i = 0; i < fit.records.length; i++) {
    const record = fit.records[i];
    if (record.position_lat !== undefined && record.position_long !== undefined) {
      track.geometry.coordinates.push([record.position_long, record.position_lat])
    }
  }
  GeoJSON.features.push(track);

  return GeoJSON;
}

function csvToGeoJSON(csvString) {
  const parseResult = Papa.parse(csvString, {delimiter: ",", header: true, dynamicTyping: false, skipEmptyLines: true});
  const latfield = getLatField(parseResult.meta.fields);
  const lonfield = getLonField(parseResult.meta.fields);
  // TODO allow manual specification of lat/lon fields
  // TODO handle non-number lat/lon formats like DMS
  if (!latfield) throw Error(`Expected latitude field. Found ${parseResult.meta.fields}.`);
  if (!lonfield) throw Error(`Expected longitude field. Found ${parseResult.meta.fields}.`);

  return {
    type: "FeatureCollection",
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

function getLatField(fields) {
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

function getLonField(fields) {
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