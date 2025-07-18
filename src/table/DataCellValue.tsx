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
    case "link":
      // if the column has a default URL, append the value to it
      return <a href={`${props.column?.default}${props.value}`} target="_blank" rel="noopener noreferrer">{props.value}</a>;
    default:
      switch (typeof props.value) {
        case "string":
          // plain text http or https URL
          if (props.value.startsWith("http")) {
            return <AbridgedUrlLink href={props.value} length={21} />
          }
          // html links
          if (props.value.startsWith("<a") && props.value.includes("href=")) {
            const match = props.value.match(/^<a\s+href="?([^">]+)"?>([^<]+)<\/a>$/);
            if (match) {
              return <a target="_blank" rel="noopener noreferrer" href={match[1]}>{match[2]}</a>;
            }
          }
          // otherwise return as plain text
          return props.value;
        case "number":
          return props.value;
        default:
          return JSON.stringify(props.value);
      }
  }
}
