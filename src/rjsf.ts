import { RJSFSchema } from "@rjsf/utils";
import { Column } from "./column";

type Operation = {
  name: string,
  arguments: number,
};
const supportedOperations : Operation[] = [
  {
    name: "==",
    arguments: 2,
  },
  {
    name: "===",
    arguments: 2,
  },
  {
    name: "!=",
    arguments: 2,
  },
  {
    name: "!==",
    arguments: 2,
  },
];

export const getSchema = (columns: Column[]) => {
  const schema : RJSFSchema = {
    $ref: "#/$defs/expression",
    $defs: {
      expression: {
        type: "object",
        anyOf: [
          { $ref: "#/$defs/stringLiteral" },
          { $ref: "#/$defs/numberLiteral" },
          { $ref: "#/$defs/booleanLiteral" },
          { $ref: "#/$defs/dateTimeLiteral" },
          { $ref: "#/$defs/property" },
          { $ref: "#/$defs/operation" },
        ],
        default: { var: "feature" },
      },
      stringLiteral: {type: "string", title: "String Literal"},
      numberLiteral: {type: "number", title: "Number Literal"},
      booleanLiteral: {type: "boolean", title: "Boolean Literal"},
      dateTimeLiteral: {type: "string", format: "date-time", title: "DateTime Literal"},
      property: {type: "object", title: "Property", properties: {var: { $ref: "#/$defs/propertyNames" }}},
      propertyNames: {
        enum: [
          "index",
          "feature",
          ...columns.map(col => `feature.properties.${col.name}`)
        ],
        default: "feature"
      },
      operation: {
        type: "object",
        title: "Operation",
        anyOf: supportedOperations.map(op => { return {
          type: "object",
          title: op.name,
          properties: {
            [op.name]: {
              type: "array",
              items: Array(op.arguments).fill({ "$ref": "#/$defs/expression" }),
            },
          },
          additionalProperties: false,
        }}),
      },
    }
  };
  return schema;
};