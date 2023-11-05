import { getFeatureLengthMeters, getFeatureVertMeters } from "../../algorithm";
import { pathNovelty } from "../../geojson-calc";

type OperatorBody = (...args: any[]) => any;

const length : OperatorBody = (feature) => {
  return getFeatureLengthMeters(feature);
};

const novelty : OperatorBody = (feature) => {
  return pathNovelty(feature);
};

export const Geo = {
  length,
  novelty,
};