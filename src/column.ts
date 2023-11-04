import { AdditionalOperation, RulesLogic } from "json-logic-js";
import { FieldTypeDescription } from "./fieldtype";
import { Expression } from "./json-logic/root";

export type Column = {
  visible: boolean,
  name: string,
  type: FieldTypeDescription,
  formula?: RulesLogic<AdditionalOperation>,
};