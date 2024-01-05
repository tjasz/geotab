// RJSF cannot handle "oneOf" schemas effectively (it's buggy).
// So the JSON logic operations are not authorable in RJSF.
// ex: we would need to author an object like this { "==": [0,1]}
// but as the operation changes, RJSF does not clear out the old property,
// so it confuses JSON logic.
// Here, we define an alternate Operation type that RJSF can understand
// and that we can convert to JSON logic at application time.

import { AdditionalOperation, JsonLogicVar, RulesLogic, apply as applyLogic, add_operation } from "json-logic-js";
import { Geo } from "./operations/geo";
import * as Turf from "@turf/turf";

export type Operation = {
  operator: string,
  arguments: Expression[]
};

export type FeatureReference = {
  index: number;
};

export type Expression<AddOps extends AdditionalOperation = never> =
    | boolean
    | string
    | number
    | JsonLogicVar<AddOps>
    | Operation
    | FeatureReference;

export const toJsonLogic = (exp: Expression) : RulesLogic<AdditionalOperation>=> {
  const op = exp as Operation;
  if (op.operator) {
    const jsonOp : RulesLogic<AdditionalOperation> = { [op.operator]: op.arguments.map(arg => toJsonLogic(arg)) };
    return jsonOp;
  }
  const ref = exp as FeatureReference;
  if (ref.index !== undefined) {
    const jsonOp = { var: `features.${ref.index}` };
    return jsonOp;
  }
  return exp as RulesLogic;
}

export const fromJsonLogic = (logic : RulesLogic<AdditionalOperation>) : Expression => {
  if (typeof logic === "object")
  {
    if (logic === null) {
      return logic;
    }
    const key = Object.keys(logic)[0];
    if (key !== "var") {
      const exp : Expression = {
        operator: Object.keys(logic)[0],
        arguments: Array.isArray(logic[key]) ? logic[key].map(fromJsonLogic) : [fromJsonLogic(logic[key])]};
      return exp;
    }
  
    const varName =
      (typeof (logic as {var: string}).var === "string") 
      ? (logic as {var: string}).var
      : (Array.isArray((logic as {var: string[]}).var) && typeof (logic as {var: string[]}).var[0] === "string")
      ? (logic as {var: string[]}).var[0]
      : "undefined";
    if (varName.startsWith("features.")) {
      return {
        index: parseInt(varName.replace("features.", ""))
      };
    }
  }
  return logic as Expression;
}

const varOf = (pathString, data, fallback) => {
  var not_found = (fallback === undefined) ? null : fallback;
  if (typeof pathString === "undefined" || pathString === "" || pathString === null) {
    return data;
  }
  var sub_props = String(pathString).split(".");
  for (var i = 0; i < sub_props.length; i++) {
    if (data === null || data === undefined) {
      return not_found;
    }
    // Descending into data
    data = data[sub_props[i]];
    if (data === undefined) {
      return not_found;
    }
  }
  return data;
}

const zip = (seq1, seq2) => {
  if (Array.isArray(seq2)) {
    return seq1.map((obj, i) => ({a: obj, b: seq2[i % seq2.length]}));
  }

  return seq1.map((obj, i) => ({a: obj, b: seq2}));
}

// add the operations to JSON logic used by geotab
export const add_operations = (): void => {
    // @ts-ignore
    add_operation("Math", Math);
    // @ts-ignore
    add_operation("Turf", Turf); // https://turfjs.org/docs
    // @ts-ignore
    add_operation("Geo", Geo);
    // @ts-ignore
    add_operation("zip", zip);
    // @ts-ignore
    add_operation("varOf", varOf);
}