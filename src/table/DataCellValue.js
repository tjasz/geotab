import { AbridgedUrlLink } from '../common-components';
import { toDate } from './../fieldtype'

export default function DataCellValue(props) {
  // transform null, undefined, empty string to undefined
  if (props.value === null || props.value === undefined || props.value === "") {
    return undefined;
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
        let date = toDate(props.value);
        return date.toISOString();
      }
      catch (e) {
        alert(`Invalid date -- could not parse "${props.value}" to date:\n ${e.message}`);
      }
    default:
      switch (typeof props.value) {
        case "string":
          return props.value.startsWith("http")
            ? <AbridgedUrlLink target="_blank" href={props.value} length={21} />
            : props.value;
        case "number":
          return props.value;
        default:
          return JSON.stringify(props.value)
      }
  }
}