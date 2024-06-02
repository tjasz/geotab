import * as Turf from "@turf/turf";
import zip from "./zip";
import varOf from "./varOf";
import Geo from "./geo";

function getMethods(obj: Object): string[] {
  return Object.getOwnPropertyNames(obj).filter(
    (p) => typeof obj[p] === "function",
  );
}

const turfOperations = getMethods(Turf).map((op) => `Turf.${op}`);

const mathOperations = getMethods(Math).map((op) => `Math.${op}`);

const geoOperaitons = getMethods(Geo).map((op) => `Geo.${op}`);

const jsonLogicOperations = [
  "log",
  "var",
  "if",
  "==",
  "===",
  "!=",
  "!==",
  "!",
  "!!",
  "or",
  "and",
  ">",
  ">=",
  "<",
  "<=",
  "max",
  "min",
  "+",
  "-",
  "*",
  "/",
  "%",
  "map",
  "reduce",
  "filter",
  "all",
  "none",
  "some",
  "merge",
  "in",
  "cat",
  "substr",
];

export const operationNames = [
  ...jsonLogicOperations,
  "varOf",
  "zip",
  ...mathOperations,
  ...turfOperations,
  ...geoOperaitons,
];

export const operations = { zip, varOf, Math, Turf, Geo };

export default operations;
