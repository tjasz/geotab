import { RJSFSchema } from "@rjsf/utils";
import { Column } from "./column";

const supportedOperations : string[] = [
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
  "in",
  "cat",
  "substr",
  "Math.abs",
  "Math.ceil",
  "Math.exp",
  "Math.floor",
  "Math.hypot",
  "Math.log",
  "Math.log10",
  "Math.log2",
  "Math.pow",
  "Math.random",
  "Math.round",
  "Math.sign",
  "Math.sqrt",
  "Math.trunc",
];

type Operation = {
  operator: string,
  arguments: object[]
};

export const toJsonLogic = (op: any) => {
  if (op.operator) {
    return { [op.operator]: op.arguments.map(arg => toJsonLogic(arg)) };
  }
  return op;
}

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
        properties: {
          operator: {type: "string", enum: supportedOperations,},
          arguments: {
            type: "array",
            items: { "$ref": "#/$defs/expression" },
          },
        },
      },
    }
  };
  return schema;
};