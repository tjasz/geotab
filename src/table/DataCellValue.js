import { AbridgedUrlLink } from '../common-components';

export default function CellValue(props) {
  // transform null, undefined, empty string to undefined
  if (props.value === null || props.value === undefined || props.value === "") {
    return undefined;
  }
  // transform URLs to links
  if (typeof props.value === "string" && props.value.startsWith("http")) {
    return <AbridgedUrlLink target="_blank" href={props.value} length={21} />;
  }
  switch (props.column.type) {
    case "number":
      try {
        return Number(props.value);
      }
      catch (e) {
        alert(`Invalid number -- could not parse "${props.value}" to number:\n ${e.message}`);
      }
    case "date":
      try {
        let date = null;
        if (typeof props.value === "number") {
          date = new Date(props.value);
        } else if (typeof props.value === "string") {
          // if it contains only digits, convert to a number; otherweise, parse as date string
          const isnum = props.value.match(/^[0-9]+$/) != null;
          date = new Date(isnum ? Number(props.value) : Date.parse(props.value));
        }
        return date.toISOString();
      }
      catch (e) {
        alert(`Invalid date -- could not parse "${props.value}" to date:\n ${e.message}`);
      }
    default:
      return typeof props.value === "string" || typeof props.value === "number"
      ? props.value
      : JSON.stringify(props.value);
  }
}