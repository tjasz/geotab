import { getFeatureLengthMeters } from "../../algorithm";

type OperatorBody = (...args: any[]) => any;

const length : OperatorBody = (feature) => {
  return getFeatureLengthMeters(feature);
}

export const Geo = {
  length,
};