export function hashCode(str) {
  return Array.from(str).reduce((hash, char) => 0 | (31 * hash + char.charCodeAt(0)), 0);
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

export function getPropertiesUnion(features) {
  const keys = features.map((feature) => Object.keys(feature["properties"])).flat();
  return new Set(keys);
}

export function getStartingCoord(feature) {
  switch(feature.geometry.type) {
    case "Point":
      return feature.geometry.coordinates;
    case "MultiPoint":
    case "LineString":
    case "Polygon":
      return feature.geometry.coordinates[0];
    case "MultiLineString":
    case "MultiPolygon":
      return feature.geometry.coordinates[0][0];
    default:
      return null;
  }
}

export function getCentralCoord(feature) {
  switch(feature.geometry.type) {
    case "Point":
      return feature.geometry.coordinates;
    case "MultiPoint":
    case "LineString":
    case "Polygon":
      return feature.geometry.coordinates[Math.floor(feature.geometry.coordinates.length/2)];
    case "MultiLineString":
    case "MultiPolygon":
      return feature.geometry.coordinates[0][0];
    default:
      return null;
  }
}