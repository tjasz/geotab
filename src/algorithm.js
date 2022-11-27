export function hashCode(str) {
  return Array.from(str).reduce((hash, char) => 0 | (31 * hash + char.charCodeAt(0)), 0);
}

export function setEquals(a, b) {
  return a.every(item => b.includes(item)) && b.every(item => a.includes(item));
}

export function getFeatures(data) {
  if (data["type"] === "Feature") {
    data.hash = hashCode(JSON.stringify(data));
    return data;
  }
  else if (data["type"] === "FeatureCollection") {
    return data["features"].map((feature) => getFeatures(feature)).flat();
  }
  return [];
}

function toType(value, type) {
  switch(type) {
    case "number":
      return Number(value);
    case "date":
      return new Date(Date.parse(value));
    default:
      return value;
  }
}

function getColumnMetadata(features, key) {
  const type = features.every((feature) => feature.properties[key] === undefined || !isNaN(Number(feature.properties[key])))
               ? "number"
               : features.every((feature) => feature.properties[key] === undefined || !isNaN(Date.parse(feature.properties[key])))
               ? "date"
               : "string";
  // find min and max
  let min = toType(features[0].properties[key], type);
  let max = min;
  for (let i = 1; i < features.length; i++) {
    const value = toType(features[i].properties[key], type);
    if (value < min) min = value;
    if (value > max) max = value;
  }
  return {
    name: key,
    visible: true,
    type,
    min,
    max,
  };
}

export function getPropertiesUnion(features) {
  const keylist = features.map((feature) => Object.keys(feature["properties"])).flat();
  const keyset = new Set(keylist);
  const columns = Array.from(keyset).map((key) => getColumnMetadata(features, key));
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
  switch(feature.geometry?.type) {
    case "Point":
      return feature.geometry.coordinates.slice(0,2).reverse();
    case "MultiPoint":
    case "LineString":
      return feature.geometry.coordinates[Math.floor(feature.geometry.coordinates.length/2)].slice(0,2).reverse();
    case "MultiLineString":
      const part = feature.geometry.coordinates[Math.floor(feature.geometry.coordinates.length/2)];
      return part[Math.floor(part.length/2)].slice(0,2).reverse();
    case "MultiPolygon":
    case "Polygon":
      const polypart = feature.geometry.coordinates[Math.floor(feature.geometry.coordinates.length/2)];
      const lons = polypart.map((coordinate) => coordinate[0]);
      const lats = polypart.map((coordinate) => coordinate[1]);
      return [(Math.max(...lats) + Math.min(...lats))/2, (Math.max(...lons) + Math.min(...lons))/2];
    default:
      return null;
  }
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
    case "Polygon":
      let sw = feature.geometry.coordinates[0].slice(0,2).reverse();
      let ne = sw.slice();
      for (const coord of feature.geometry.coordinates) {
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
    case "MultiLineString":
    case "MultiPolygon":
      sw = feature.geometry.coordinates[0][0].slice(0,2).reverse();
      ne = sw.slice();
      for (const part of feature.geometry.coordinates) {
        for (const coord in part) {
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
      }
      return [
        sw,
        ne
      ];
    default:
      return null;
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