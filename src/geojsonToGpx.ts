import { Feature, FeatureCollection, GeometryType } from "./geojson-types";

// https://www.topografix.com/GPX/1/1/gpx.xsd
// https://www.topografix.com/GPX/1/1/
export function geoJsonToGpx(featureCollection: FeatureCollection) {
  const geoJsonPoints = featureCollection.features
    .filter(feature => feature.geometry.type === GeometryType.Point);
  const waypoints = geoJsonPoints.map(pointToWaypoint);

  const geoJsonLineStrings = featureCollection.features
    .filter(feature => feature.geometry.type === GeometryType.LineString);
  const routes = geoJsonLineStrings.map(lineStringToRoute);

  // TODO other geometry types
  console.log({ featureCollection, geoJsonPoints, waypoints, geoJsonLineStrings, routes })

  return `<gpx version="1.1" creator="geotab">
    ${waypoints.join("\n")}
    ${routes.join("\n")}
    </gpx>`
}

function pointToWaypoint(feature: Feature) {
  if (feature.geometry.type === GeometryType.Point) {
    return `<wpt lat="${feature.geometry.coordinates[1]}}" lon="${feature.geometry.coordinates[0]}">
        ${feature.geometry.coordinates[2] ? "<ele>" + feature.geometry.coordinates[2] + "</ele>" : ""}
        ${feature.properties.name ? "<name>" + feature.properties.name + "</name>" : ""}
      </wpt>`;
  }
}

function lineStringToRoute(feature: Feature) {
  if (feature.geometry.type === GeometryType.LineString) {
    return `<rte>
        ${feature.properties.name ? "<name>" + feature.properties.name + "</name>" : ""}
        ${feature.geometry.coordinates.map(coord =>
      `<rtept lat="${coord[1]}" lon="${coord[0]}">
              ${coord[2] ? "<ele>" + coord[2] + "</ele>" : ""}
            </rtept>`
    ).join("\n")}
      </rte>`;
  }
}
