import { RJSFSchema } from "@rjsf/utils";
import { Column } from "./column";

export const getSchema = (columns: Column[]) => {
  const schema : RJSFSchema = {
    type: "object",
    anyOf: [
      { $ref: "#/$defs/stringLiteral" },
      { $ref: "#/$defs/numberLiteral" },
      { $ref: "#/$defs/booleanLiteral" },
      { $ref: "#/$defs/dateTimeLiteral" },
      { $ref: "#/$defs/property" },
      { $ref: "#/$defs/expression" },
    ],
    $defs: {
      stringLiteral: {type: "string", title: "String Literal"},
      numberLiteral: {type: "number", title: "Number Literal"},
      booleanLiteral: {type: "boolean", title: "Boolean Literal"},
      dateTimeLiteral: {type: "string", format: "datetime", title: "DateTime Literal"},
      property: {type: "object", title: "Property", properties: {var: { $ref: "#/$defs/propertyNames" }}},
      propertyNames: {
        enum: [
          "index",
          "feature",
          ...columns.map(col => `feature.properties.${col.name}`)
        ],
        default: "feature"
      },
      operatorNames: {
        enum: [
          "missing",
          "missing_some",
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
          "filter",
          "reduce",
          "all",
          "none",
          "some",
          "merge",
          "in",
          "cat",
          "substr",
          "log",
        ],
      },
      expression: {
        type: "object",
        title: "Expression",
        properties: {
          operator: { $ref: "#/$defs/operatorNames" },
          arguments: {
            type: "array",
            title: "Arguments",
            items: {
              type: "object",
              anyOf: [
                { $ref: "#/$defs/stringLiteral" },
                { $ref: "#/$defs/numberLiteral" },
                { $ref: "#/$defs/booleanLiteral" },
                { $ref: "#/$defs/dateTimeLiteral" },
                { $ref: "#/$defs/property" },
                { $ref: "#/$defs/expression" },
              ]
            },
          },
        },
      },
    }
  };
  return schema;
};