import { JsonSchema } from "json-schema-library";
import { Column } from "../column";
import { operationNames } from "./operations";

export const getSchema = (columns: Column[]) => {
  const schema: JsonSchema = {
    $ref: "#/$defs/expression",
    $defs: {
      expression: {
        type: "object",
        anyOf: [
          { $ref: "#/$defs/null" },
          { $ref: "#/$defs/stringLiteral" },
          { $ref: "#/$defs/numberLiteral" },
          { $ref: "#/$defs/booleanLiteral" },
          { $ref: "#/$defs/dateTimeLiteral" },
          { $ref: "#/$defs/pointLiteral" },
          { $ref: "#/$defs/operation" },
        ],
        default: { var: "feature" },
      },
      null: { type: "null" },
      stringLiteral: { type: "string", title: "String Literal" },
      numberLiteral: { type: "number", title: "Number Literal" },
      booleanLiteral: { type: "boolean", title: "Boolean Literal" },
      dateTimeLiteral: {
        type: "string",
        format: "date-time",
        title: "DateTime Literal",
      },
      pointLiteral: {
        type: "array",
        items: { type: "number", default: 0 },
        minItems: 2,
        title: "Point Literal",
        default: [-122.33419, 47.60005],
      },
      expressionArray: {
        type: "array",
        items: { $ref: "#/$defs/expression" },
      },
      operation: {
        type: "object",
        maxProperties: 1,
        patternProperties: {
          "": [
            { $ref: "#/$defs/expression" },
            { $ref: "#/$defs/expressionArray" },
          ],
        },
        propertyNames: { enum: operationNames },
      },
    },
  };
  return schema;
};
