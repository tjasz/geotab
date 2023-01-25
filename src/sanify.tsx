import {getDistance} from './algorithm'
import * as GeoJson from './geojson-types'

export function sanifyFeatures(features:GeoJson.Feature[]) : GeoJson.Feature[] {
  console.log(features)
  return features.map(sanifyFeature);
}

export function sanifyFeature(feature:GeoJson.Feature) : GeoJson.Feature {
  switch(feature.geometry?.type) {
    case GeoJson.GeometryType.Point:
      return {...feature, geometry: {...feature.geometry, coordinates: feature.geometry.coordinates.slice(0,2).map((v) => roundTo(v, 5))}};
    case GeoJson.GeometryType.MultiPoint:
    case GeoJson.GeometryType.LineString:
      return {...feature, geometry: {...feature.geometry, coordinates: sanifyCoordinateList(feature.geometry.coordinates)}};
    case GeoJson.GeometryType.MultiLineString:
    case GeoJson.GeometryType.Polygon:
      return {...feature, geometry: {...feature.geometry, coordinates: feature.geometry.coordinates.map(sanifyCoordinateList)}};
    case GeoJson.GeometryType.MultiPolygon:
      return {...feature, geometry: {...feature.geometry, coordinates: feature.geometry.coordinates.map((seg) => seg.map(sanifyCoordinateList))}};
    default:
      console.error(feature)
      return feature;
  }
}

function sanifyCoordinateList(coordinates:GeoJson.Coordinate[]) : GeoJson.Coordinate[] {
  // round lat, lon data to 1e-5 degrees (1.11 meters)
  const coords = coordinates.map((coord) => coord.map((v) => roundTo(v, 5)));
  const newCoords = coords.length ? [coords[0]] : [];
  for (let i = 1; i < coords.length; i++) {
    // trim coordinates where the speed is unreasonable
    if (coords[i].length > 3) {
      const instantDist = getDistance(coords[i], coords[i-1]); // meters
      const time = (coords[i][3] - coords[i-1][3]) / 1000; // seconds
      const speed = instantDist / time; // meters per second
      const vspeed = (coords[i][2] - coords[i-1][2]) / time;
      // non-motorized human land-speed world record held by skier Ivan Origone is 71 m/s
      if (speed > 71) {
        continue;
      }
      if (vspeed > 71) {
        continue;
      }
    }
    // trim coordinates where the distance traveled since last accepted point is less than 1 meter
    const dist = getDistance(coords[i], newCoords[newCoords.length-1]);
    if (dist < 1) {
      continue;
    }
    // remove elevation, time from coordinate
    newCoords.push(coords[i].slice(0,2));
  }
  return newCoords;
}

function roundTo(val:number, places:number) : number {
  const pow = Math.pow(10, places);
  return Math.round(val*pow)/pow;
}