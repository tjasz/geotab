import {buffer, combine, union} from "@turf/turf";
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
  return features.reduce((cumulator, feature) => union(cumulator, feature))
};

export const Geo = {
  beginning,
  ending,
  novelty,
  unionMany,
};