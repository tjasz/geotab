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
      }
    }
  };
  return schema;
};