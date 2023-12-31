// RJSF cannot handle "oneOf" schemas effectively (it's buggy).
// So the JSON logic operations are not authorable in RJSF.
// ex: we would need to author an object like this { "==": [0,1]}
// but as the operation changes, RJSF does not clear out the old property,
// so it confuses JSON logic.
// Here, we define an alternate Operation type that RJSF can understand
// and that we can convert to JSON logic at application time.

import { AdditionalOperation, JsonLogicVar, RulesLogic, apply as applyLogic, add_operation } from "json-logic-js";
import { Geo } from "./operations/geo";

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
    const key = Object.keys(logic)[0];
    if (key !== "var") {
      const exp : Expression = {
        operator: Object.keys(logic)[0],
        arguments: Array.isArray(logic[key]) ? logic[key].map(fromJsonLogic) : [fromJsonLogic(logic[key])]};
      return exp;
    }
    const varName = (logic as {var: string}).var;
    if (varName.startsWith("features.")) {
      return {
        index: parseInt(varName.replace("features.", ""))
      };
    }
  }
  return logic as Expression;
}

export const apply = (exp: Expression, data?: unknown) => {
  return applyLogic(toJsonLogic(exp), data);
};

// add the operations to JSON logic used by geotab
export const add_operations = (): void => {
    // @ts-ignore
    add_operation("Math", Math);
    // @ts-ignore
    add_operation("Geo", Geo);
}