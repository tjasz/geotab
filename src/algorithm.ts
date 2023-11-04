import { v4 as uuidv4 } from 'uuid';
import math from './math'
import { toType } from './fieldtype'

export function sleep (time:number) : Promise<NodeJS.Timeout> {
  return new Promise((resolve) => setTimeout(resolve, time));
}

export function hashCode(str:string) : number {
  return Array.from(str.substring(0,1024)).reduce((hash, char) => 0 | (31 * hash + char.charCodeAt(0)), 0);
}

// TODO use sets instead of arrays
export function setEquals<T>(a:T[], b:T[]) : boolean {
  return a.every(item => b.includes(item)) && b.every(item => a.includes(item));
}

export function getFeatures(data) {
  if (!data) return [];
  if (data["type"] === "Feature") {
    if (data.id === undefined) {
      data.id = uuidv4();
    }
    return {geometry: data.geometry, id: data.id, type: data.type, properties: data.properties};
  }
  else if (data["type"] === "FeatureCollection") {
    return data["features"].map((feature) => getFeatures(feature)).flat();
  }
  return [];
}

function isEmptyField(v:any) {
  return v === null || v === undefined || v === "";
}

function getColumnMetadata(features, key, existingProperties) {
  if (existingProperties) {
    const existingProperty = existingProperties.find(prop => prop.name === key);
    if (existingProperty) return existingProperty;
  }
  const type = features.every((feature) => feature.properties[key] === undefined || feature.properties[key] === "" || !isNaN(Number(feature.properties[key])))
               ? "number"
               : features.every((feature) => feature.properties[key] === undefined || feature.properties[key] === "" || (typeof feature.properties[key] === "string" && feature.properties[key].match(/^[0-9]{4}/) && !isNaN(Date.parse(feature.properties[key]))))
               ? "date"
               : "string";
  return {
    name: key,
    visible: true,
    type,
  };
}

export function getPropertiesUnion(features, existingProperties) {
  const keylist = features.map((feature) => Object.keys(feature["properties"])).flat();
  const keyset = new Set(keylist);
  const columns = Array.from(keyset).map((key) => getColumnMetadata(features, key, existingProperties));
  return columns;
}

export function getStartingCoord(feature) {
  switch(feature.geometry.type) {
    case "Point":
      return feature.geometry.coordinates;
    case "MultiPoint":
    case "LineString":
      return feature.geometry.coordinates[0];
    case "Polygon":
    case "MultiLineString":
    case "MultiPolygon":
      return feature.geometry.coordinates[0][0];
    default:
      return null;
  }
}

export function getCentralCoord(feature) {
  if (!feature?.geometry?.coordinates?.length) return undefined;
  switch(feature.geometry?.type) {
    case "Point":
      return feature.geometry.coordinates.slice(0,2).reverse();
    case "MultiPoint":
    case "LineString":
      return feature.geometry.coordinates[Math.floor(feature.geometry.coordinates.length/2)].slice(0,2).reverse();
    case "MultiLineString":
      const part = feature.geometry.coordinates[Math.floor(feature.geometry.coordinates.length/2)];
      return part[Math.floor(part.length/2)].slice(0,2).reverse();
    case "Polygon":
      const polypart = feature.geometry.coordinates[Math.floor(feature.geometry.coordinates.length/2)];
      const lons = polypart.map((coordinate) => coordinate[0]);
      const lats = polypart.map((coordinate) => coordinate[1]);
      return [(Math.max(...lats) + Math.min(...lats))/2, (Math.max(...lons) + Math.min(...lons))/2];
    case "MultiPolygon":
      const multipolypart = feature.geometry.coordinates[Math.floor(feature.geometry.coordinates.length/2)];
      const mpolypart = multipolypart[Math.floor(multipolypart.length/2)];
      const mlons = mpolypart.map((coordinate) => coordinate[0]);
      const mlats = mpolypart.map((coordinate) => coordinate[1]);
      return [(Math.max(...mlats) + Math.min(...mlats))/2, (Math.max(...mlons) + Math.min(...mlons))/2];
    default:
      return null;
  }
}

function getCoordinateListBounds(coords) {
  if (!coords || !coords.length) {
    return [[undefined, undefined], [undefined, undefined]]
  }
  let sw = coords[0].slice(0,2).reverse();
  let ne = sw.slice();
  for (const coord of coords) {
    const latlon = coord.slice(0,2).reverse();
    if (latlon[0] < sw[0]) {
      sw[0] = latlon[0];
    }
    if (latlon[1] < sw[1]) {
      sw[1] = latlon[1];
    }
    if (latlon[0] > ne[0]) {
      ne[0] = latlon[0];
    }
    if (latlon[1] > ne[1]) {
      ne[1] = latlon[1];
    }
  }
  return [
    sw,
    ne
  ];
}

export function getFeatureBounds(feature) {
  // TODO: what about going over 0 lon?
  switch(feature.geometry?.type) {
    case "Point":
      const latlon = feature.geometry.coordinates.slice(0,2).reverse();
      return [
        latlon,
        latlon
      ];
    case "MultiPoint":
    case "LineString":
      return getCoordinateListBounds(feature.geometry.coordinates);
    case "MultiLineString":
    case "Polygon":
      return getCoordinateListBounds(feature.geometry.coordinates.flat());
    case "MultiPolygon":
      return getCoordinateListBounds(feature.geometry.coordinates.flat(2));
    default:
      return null;
  }
}

export function getDistance(pta, ptb) {
  if (pta[0] === ptb[0] && pta[1] === ptb[1]) return 0;
  // use haversine formula to calcualte distance between two points
  const earthRadiusMeters = 6378e3;
  const delta_lat = pta[0] - ptb[0];
  const delta_lon = pta[1] - ptb[1];
  const sin_half_delta_lat = math.dsin(delta_lat/2);
  const sin_half_delta_lon = math.dsin(delta_lon/2);
  const a = sin_half_delta_lat * sin_half_delta_lat
          + math.dcos(ptb[0]) * math.dcos(pta[0])
          * sin_half_delta_lon * sin_half_delta_lon;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const d = c * earthRadiusMeters;
  return d;
}

function getLengthFromCoordinateList(coordinates) {
  if (coordinates.length < 2) {
    return 0;
  }
  let dist = 0;
  let lastLatlon = coordinates[0].slice(0,2).reverse();
  for (const coord of coordinates) {
    // translate coordinate from lonlat to latlon
    const latlon = coord.slice(0,2).reverse();
    dist += getDistance(latlon, lastLatlon);
    // update reference to last point
    lastLatlon = latlon;
  }
  return dist;
}

export function getFeatureLengthMeters(feature) {
  // TODO: what about going over 0 lon?
  switch(feature.geometry?.type) {
    case "Point":
    case "MultiPoint":
      return 0;
    case "LineString":
      return getLengthFromCoordinateList(feature.geometry.coordinates);
    case "MultiLineString":
    case "Polygon":
      return feature.geometry.coordinates.reduce(
        (accumulator, part) => accumulator + getLengthFromCoordinateList(part), 0);
    case "MultiPolygon":
      return feature.geometry.coordinates.reduce(
        (accumulator, polygon) => accumulator + polygon.reduce(
          (accumulator, part) => accumulator + getLengthFromCoordinateList(part), 0), 0);
    default:
      return NaN;
  }
}

function getVertFromCoordinateList(coordinates) {
  let [pvert, nvert] = [0, 0];
  if (coordinates.length < 2) {
    return [pvert, nvert];
  }
  let lastElev = coordinates[0][2];
  for (const coord of coordinates) {
    const elev = coord[2];
    // calculate positive and negative vert
    if (elev > lastElev + 1) {
      pvert += (elev - lastElev);
      // update reference to last point
      lastElev = elev;
    } else if (elev < lastElev - 1) {
      nvert += (elev - lastElev);
      // update reference to last point
      lastElev = elev;
    }
  }
  return [pvert, nvert];
}

export function getFeatureVertMeters(feature) {
  switch(feature.geometry?.type) {
    case "Point":
    case "MultiPoint":
      return 0;
    case "LineString":
      return getVertFromCoordinateList(feature.geometry.coordinates);
    case "MultiLineString":
    case "MultiPolygon":
    case "Polygon":
      return feature.geometry.coordinates.reduce(
        (accumulator, part) => accumulator + getVertFromCoordinateList(part), 0);
    default:
      return NaN;
  }
}

export function getFeatureListBounds(features) {
  let bounds = [[null, null], [null, null]];
  for (const feature of features) {
    const fBounds = getFeatureBounds(feature);
    if (fBounds !== null) {
      if (bounds[0][0] === null || fBounds[0][0] < bounds[0][0]) {
        bounds[0][0] = fBounds[0][0];
      }
      if (bounds[0][1] === null || fBounds[0][1] < bounds[0][1]) {
        bounds[0][1] = fBounds[0][1];
      }
      if (bounds[1][0] === null || fBounds[1][0] > bounds[1][0]) {
        bounds[1][0] = fBounds[1][0];
      }
      if (bounds[1][1] === null || fBounds[1][1] > bounds[1][1]) {
        bounds[1][1] = fBounds[1][1];
      }
    }
  }
  return bounds.flat().some((bound) => bound === null) ? null : bounds;
}

export function sortBy(features, sorting) {
  const {col, asc} = sorting;
  const fsort = (a, b) => {
    const ar = a.properties[col.name];
    const br = b.properties[col.name]
    // always sort undefined as if they're small
    // JS method of always returning false results in non-deterministic sorting
    const aempty = isEmptyField(ar);
    const bempty = isEmptyField(br);
    if (aempty && bempty) {
      return 0;
    }
    if (aempty && !bempty) {
      return asc ? -1 : 1;
    }
    if (!aempty && bempty) {
      return asc ? 1 : -1;
    }
    // compare transformed values
    const av = toType(ar, col.type);
    const bv = toType(br, col.type);
    if (av === bv) {
      return 0;
    } else if (av < bv) {
      return asc ? -1 : 1;
    }
    return asc ? 1 : -1;
  }
  features.sort(fsort);
  return features;
}