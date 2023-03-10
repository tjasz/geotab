import * as GeoJson from './geojson-types'

// Manipulate the selection status to add or remove "hover", or to activate or deactivate
function addHover(status?:string) {
  if (status === undefined) {
    return "hoverinactive";
  }
  return status.includes("hover") ? status : "hover" + status;
}
function removeHover(status?:string) {
  if (status === undefined) {
    return "inactive";
  }
  return status.replace("hover","");
}
function toggleActive(status?:string) {
  if (status === undefined) {
    return "active";
  }
  return status.includes("inactive") ? status.replace("inactive", "active") : status.replace("active", "inactive");
}
// Manipulate a feature list when an action occurs on a certain feature with given ID
export function onMouseOver(featureId:string, data:GeoJson.Feature[]):GeoJson.Feature[] {
  return data.map(f =>
    f.id === featureId
    ? {...f, properties: {...f.properties, ["geotab:selectionStatus"]: addHover(f.properties["geotab:selectionStatus"])}}
    : {...f, properties: {...f.properties, ["geotab:selectionStatus"]: removeHover(f.properties["geotab:selectionStatus"])}}
    );
}
export function onMouseOut(featureId:string, data:GeoJson.Feature[]):GeoJson.Feature[] {
  return data.map(f =>
    f.id === featureId
    ? {...f, properties: {...f.properties, ["geotab:selectionStatus"]: removeHover(f.properties["geotab:selectionStatus"])}}
    : f
    );
}
export function onMouseClick(featureId:string, data:GeoJson.Feature[]):GeoJson.Feature[] {
  return data.map(f =>
    f.id === featureId
    ? {...f, properties: {...f.properties, ["geotab:selectionStatus"]: toggleActive(f.properties["geotab:selectionStatus"])}}
    : f
    );
}