import * as Turf from "@turf/turf";
import { getEndingCoord, getStartingCoord } from "../../algorithm";
import { pathNovelty } from "../../geojson-calc";

type OperatorBody = (...args: any[]) => any;

const beginning: OperatorBody = (feature) => {
  return getStartingCoord(feature);
};

const ending: OperatorBody = (feature) => {
  return getEndingCoord(feature);
};

const novelty: OperatorBody = (feature) => {
  return pathNovelty(feature);
};

const unionMany: OperatorBody = (...features) => {
  return features.reduce((cumulator, feature) =>
    Turf.union(cumulator, feature),
  );
};

const distanceToPoint: OperatorBody = (feature, point) => {
  switch (feature.geometry.type) {
    case "Point":
      return Turf.distance(feature, point);
    case "MultiPoint":
      return feature.geometry.coordinates.reduce(
        (acc, curr) => Math.min(Turf.distance(curr, point), acc),
        Infinity,
      );
    case "LineString":
      return Turf.pointToLineDistance(point, feature);
    case "MultiLineString":
      return feature.geometry.coordinates.reduce(
        (acc, curr) =>
          Math.min(Turf.pointToLineDistance(point, Turf.lineString(curr)), acc),
        Infinity,
      );
    case "Polygon":
      if (Turf.booleanPointInPolygon(point, feature)) {
        return 0;
      }
      return distanceToPoint(Turf.polygonToLineString(feature), point);
    case "MultiPolygon":
      return feature.geometry.coordinates.reduce(
        (acc, curr) =>
          Math.min(distanceToPoint(Turf.polygon(curr), point), acc),
        Infinity,
      );
    case "GeometryCollection":
      return feature.geometry.geometries.reduce(
        (acc, curr) =>
          Math.min(distanceToPoint(Turf.feature(curr), point), acc),
        Infinity,
      );
  }
};

const toOutAndBack: OperatorBody = (feature, point) => {
  switch (feature.geometry.type) {
    case "Point":
    case "MultiPoint":
      throw new Error("toOutAndBack not implemented for this geometry type");
    case "LineString":
      return {
        ...feature,
        geometry: {
          ...feature.geometry,
          coordinates: feature.geometry.coordinates.concat(
            feature.geometry.coordinates.toReversed(),
          ),
        },
      };
    case "MultiLineString":
    case "Polygon":
    case "MultiPolygon":
    case "GeometryCollection":
      throw new Error("toOutAndBack not implemented for this geometry type");
  }
};

const steepestInterval: OperatorBody = (feature, intervalMeters: number) => {
  switch (feature.geometry.type) {
    case "Point":
    case "MultiPoint":
      throw new Error("steepestInterval not implemented for this geometry type");
    case "LineString":
      const coords = feature.geometry.coordinates;
      if (coords[0].length < 3) {
        throw new Error("Cannot calculate steepest interval on feature with only 2d coordinates");
      }
      // pre compute distance and gain array so that it doesn't need repeating during looping
      const distances = coords.map((c, i) => i ? Turf.distance(c, coords[i - 1], { units: "meters" }) : 0);
      const gains = coords.map((c, i) => i ? Math.max(0, c[2] - coords[i - 1][2]) : 0);

      let i = 0, j = 1, currentIntervalDist = 0, currentIntervalGain = 0;
      // increment j until it defines an interval of the desired length
      while (currentIntervalDist < intervalMeters && j < coords.length) {
        // add the distance and positive elevation change to the interval stats
        // TODO distance between each pair of points should be calculated in one iteration before hand instead of multiple times
        currentIntervalDist += distances[j];
        currentIntervalGain += gains[j];
      }
      // if path is shorter than the interval, there is no steepest interval
      if (j === coords.length - 1) {
        return undefined;
      }
      // iterate over intervals
      let steepestGrade = currentIntervalGain / currentIntervalDist;
      while (i < coords.length && j < coords.length) {
        // if interval is too long, advance i
        while (currentIntervalDist > intervalMeters && i < coords.length) {
          currentIntervalDist -= distances[i];
          currentIntervalGain -= gains[i];
          i += 1;
        }
        // then, consider if current gain is the most
        const currentGrade = currentIntervalGain / currentIntervalDist;
        if (currentGrade > steepestGrade) {
          steepestGrade = currentGrade;
        }
        // advance j
        j += 1;
      }
      return steepestGrade;
    case "MultiLineString":
    case "Polygon":
    case "MultiPolygon":
    case "GeometryCollection":
      throw new Error("steepestInterval not implemented for this geometry type");
  }
}

export const Geo = {
  beginning,
  ending,
  novelty,
  unionMany,
  distanceToPoint,
  toOutAndBack,
  steepestInterval,
};

export default Geo;
