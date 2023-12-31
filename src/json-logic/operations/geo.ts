import {buffer, combine, union} from "@turf/turf";
import { getEndingCoord, getFeatureLengthMeters, getFeatureVertMeters, getStartingCoord } from "../../algorithm";
import { distance, pathNovelty } from "../../geojson-calc";

type OperatorBody = (...args: any[]) => any;

const length : OperatorBody = (feature) => {
  return getFeatureLengthMeters(feature);
};

const distancePointToPoint : OperatorBody = (p1, p2) => {
  if (p1 === undefined || p2 === undefined) {
    return undefined;
  }
  return distance(p1, p2);
};

const beginning : OperatorBody = (feature) => {
  return getStartingCoord(feature);
};

const ending : OperatorBody = (feature) => {
  return getEndingCoord(feature);
};

const novelty : OperatorBody = (feature) => {
  return pathNovelty(feature);
};

const bufferMeters : OperatorBody = (feature, distMeters) => {
  return buffer(feature, distMeters / 1000, {units: "kilometers"}).geometry;
};

const unionMany : OperatorBody = (...features) => {
  return features.reduce((cumulator, feature) => union(cumulator, feature)).geometry
};

export const Geo = {
  length,
  distancePointToPoint,
  beginning,
  ending,
  novelty,
  bufferMeters,
  unionMany
};