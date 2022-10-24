export function hashCode(str) {
  return Array.from(str).reduce((hash, char) => 0 | (31 * hash + char.charCodeAt(0)), 0);
}

export function getFeatures(data) {
  if (data["type"] === "Feature") {
    data.hash = hashCode(JSON.stringify(data));
    console.log(data.hash);
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