// RJSF cannot handle "oneOf" schemas effectively (it's buggy).
// So the JSON logic operations are not authorable in RJSF.
// ex: we would need to author an object like this { "==": [0,1]}
// but as the operation changes, RJSF does not clear out the old property,
// so it confuses JSON logic.
// Here, we define an alternate Operation type that RJSF can understand
// and that we can convert to JSON logic at application time.

import { AdditionalOperation, JsonLogicVar, RulesLogic, apply as applyLogic, add_operation } from "json-logic-js";

export type Operation = {
  operator: string,
  arguments: Expression[]
};

export type Expression<AddOps extends AdditionalOperation = never> =
    | boolean
    | string
    | number
    | JsonLogicVar<AddOps>
    | Operation;

const toJsonLogic = (exp: Expression) : RulesLogic<AdditionalOperation>=> {
  const op = exp as Operation;
  if (op.operator) {
    const jsonOp : RulesLogic<AdditionalOperation> = { [op.operator]: op.arguments.map(arg => toJsonLogic(arg)) };
    return jsonOp;
  }
  return exp as RulesLogic;
}

export const apply = (exp: Expression, data?: unknown) => {
  return applyLogic(toJsonLogic(exp), data);
};

// add the operations to JSON logic used by geotab
export const add_operations = (): void => {
    // @ts-ignore
    add_operation("Math", Math);
}