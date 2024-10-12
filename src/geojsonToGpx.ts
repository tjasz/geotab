import { Feature, FeatureCollection, GeometryType } from "./geojson-types";

// https://www.topografix.com/GPX/1/1/gpx.xsd
// https://www.topografix.com/GPX/1/1/
export function geoJsonToGpx(featureCollection: FeatureCollection) {
  const geoJsonPoints = featureCollection.features
    .filter(feature => feature.geometry.type === GeometryType.Point);
  const waypoints = geoJsonPoints.map(pointToWaypoint);

  const geoJsonLineStrings = featureCollection.features
    .filter(feature => feature.geometry.type === GeometryType.LineString);

  const geoJsonMultiLineStrings = featureCollection.features
    .filter(feature => feature.geometry.type === GeometryType.MultiLineString);
  const routes = geoJsonLineStrings.map(lineStringToTrack)
    .concat(geoJsonMultiLineStrings.map(multiLineStringToTrack));

  // TODO other geometry types
  console.log({ featureCollection, geoJsonPoints, waypoints, geoJsonLineStrings, routes })

  return `<?xml version="1.0"?><gpx xmlns="http://www.topografix.com/GPX/1/1" version="1.1" creator="geotab">
  ${waypoints.join("\n")}
  ${routes.join("\n")}
</gpx>`
}

function pointToWaypoint(feature: Feature) {
  if (feature.geometry.type === GeometryType.Point) {
    return `<wpt lat="${feature.geometry.coordinates[1]}" lon="${feature.geometry.coordinates[0]}">
  ${feature.geometry.coordinates[2] ? "<ele>" + feature.geometry.coordinates[2] + "</ele>" : ""}
  ${nameTag(feature)}
  ${cmtTag(feature)}
  ${descTag(feature)}
</wpt>`;
  }
}

function lineStringToRoute(feature: Feature) {
  if (feature.geometry.type === GeometryType.LineString) {
    return `<rte>
  ${nameTag(feature)}
  ${cmtTag(feature)}
  ${descTag(feature)}
  ${feature.geometry.coordinates.map(coord => coordToPoint(coord, 'rtept')).join("\n")}
</rte>`;
  }
}

function lineStringToTrack(feature: Feature) {
  if (feature.geometry.type === GeometryType.LineString) {
    return `<trk>
  ${nameTag(feature)}
  ${cmtTag(feature)}
  ${descTag(feature)}
  <trkseg>
  ${feature.geometry.coordinates.map(coord => coordToPoint(coord, 'trkpt')).join("\n")}
  </trkseg>
</trk>`;
  }
}

function multiLineStringToTrack(feature: Feature) {
  if (feature.geometry.type === GeometryType.MultiLineString) {
    return `<trk>
  ${nameTag(feature)}
  ${cmtTag(feature)}
  ${descTag(feature)}
  ${feature.geometry.coordinates.map(coord =>
      `<trkseg>
    ${coord.map(c => coordToPoint(c, 'trkpt'))}
    </trkseg>`)}
</trk>`;
  }
}

function coordToPoint(c: number[], type: string) {
  return `<${type} lat="${c[1]}" lon="${c[0]}">${c[2] ? "<ele>" + c[2] + "</ele>" : ""}</${type}>`;
}

function nameTag(feature: Feature) {
  const name = feature.properties.name ?? feature.properties.title;
  if (name) {
    return `<name>${escape(name)}</name>`;
  }
  return '';
}

function cmtTag(feature: Feature) {
  const comment = feature.properties.cmt ?? feature.properties.comment;
  if (comment) {
    return `<cmt>${escape(comment)}</cmt>`;
  }
  return '';
}

function descTag(feature: Feature) {
  const description = feature.properties.desc
    ?? feature.properties.description;
  if (description) {
    return `<desc>${escape(description)}</desc>`;
  }
  return '';
}

function escape(str: string) {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll(">", "&gt;")
    .replaceAll("<", "&lt;")
    .replaceAll("'", "&39;")
    .replaceAll('"', "&34;")
}