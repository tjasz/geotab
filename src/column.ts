import { FieldTypeDescription } from "./fieldtype";

export type Column = {
  visible: boolean,
  name: string,
  type: FieldTypeDescription,
  formula?: string,
};