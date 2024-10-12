import AbridgedUrlLink from "../common/AbridgedUrlLink";
import { toDate } from "./../fieldtype";

export default function DataCellValue(props) {
  // transform null, undefined, empty string to undefined
  if (props.value === null || props.value === undefined || props.value === "") {
    return undefined;
  }
  switch (props.column?.type) {
    case "number":
      return Number(props.value);
    case "date":
      try {
        let date = toDate(props.value);
        return date.toISOString();
      } catch (e) {
        if (e instanceof RangeError) {
          alert(
            `Invalid date -- could not parse "${props.value}" to date:\n ${e.message}`,
          );
        } else {
          throw e;
        }
        return typeof props.value === "string"
          ? props.value
          : JSON.stringify(props.value);
      }
    default:
      switch (typeof props.value) {
        case "string":
          return props.value.startsWith("http") ? (
            <AbridgedUrlLink target="_blank" href={props.value} length={21} />
          ) : (
            props.value
          );
        case "number":
          return props.value;
        default:
          return JSON.stringify(props.value);
      }
  }
}
