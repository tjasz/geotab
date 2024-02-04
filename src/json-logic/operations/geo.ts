import * as Turf from "@turf/turf";
import { getEndingCoord, getStartingCoord } from "../../algorithm";
import { pathNovelty } from "../../geojson-calc";

type OperatorBody = (...args: any[]) => any;

const beginning : OperatorBody = (feature) => {
  return getStartingCoord(feature);
};

const ending : OperatorBody = (feature) => {
  return getEndingCoord(feature);
};

const novelty : OperatorBody = (feature) => {
  return pathNovelty(feature);
};

const unionMany : OperatorBody = (...features) => {
  return features.reduce((cumulator, feature) => Turf.union(cumulator, feature))
};

const distanceToPoint : OperatorBody = (feature, point) => {
  switch (feature.geometry.type) {
    case "Point":
      return Turf.distance(feature, point);
    case "MultiPoint":
      return feature.geometry.coordinates
        .reduce((acc, curr) => Math.min(Turf.distance(curr, point), acc), Infinity);
    case "LineString":
      return Turf.pointToLineDistance(point, feature);
    case "MultiLineString":
      return feature.geometry.coordinates
        .reduce((acc, curr) => Math.min(Turf.pointToLineDistance(point, Turf.lineString(curr)), acc), Infinity);
    case "Polygon":
      if (Turf.booleanPointInPolygon(point, feature)) {
        return 0;
      }
      return distanceToPoint(Turf.polygonToLineString(feature), point);
    case "MultiPolygon":
      return feature.geometry.coordinates
        .reduce((acc, curr) => Math.min(distanceToPoint(Turf.polygon(curr), point), acc), Infinity);
    case "GeometryCollection":
      return feature.geometry.geometries
        .reduce((acc, curr) => Math.min(distanceToPoint(Turf.feature(curr), point), acc), Infinity);
  }
}

const toOutAndBack : OperatorBody = (feature, point) => {
  switch (feature.geometry.type) {
    case "Point":
    case "MultiPoint":
      throw new Error("toOutAndBack not implemented for this geometry type");
    case "LineString":
      return {...feature, geometry: {...feature.geometry, coordinates: feature.geometry.coordinates.concat(feature.geometry.coordinates.toReversed())}};
    case "MultiLineString":
    case "Polygon":
    case "MultiPolygon":
    case "GeometryCollection":
      throw new Error("toOutAndBack not implemented for this geometry type");
  }
}

export const Geo = {
  beginning,
  ending,
  novelty,
  unionMany,
  distanceToPoint,
  toOutAndBack,
};

export default Geo;