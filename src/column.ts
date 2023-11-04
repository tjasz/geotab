import { AdditionalOperation, RulesLogic } from "json-logic-js";
import { FieldTypeDescription } from "./fieldtype";

export type Column = {
  visible: boolean,
  name: string,
  type: FieldTypeDescription,
  formula?: RulesLogic<AdditionalOperation>,
};