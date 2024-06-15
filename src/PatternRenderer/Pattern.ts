import Svg, { SvgPath } from "./Svg"

type PatternPart = {
  path: SvgPath;
  offset: number | "100%";
  interval: number;
  type: "F" | "T";
}
export type Pattern = "solid" | PatternPart[];

export function parsePattern(s: string): Pattern {
  if (s === "solid") {
    return "solid";
  }

  const patternParts = s.split(";");
  return patternParts.map(part => {
    const parameters = part.split(",");
    const path = Svg.parse(parameters[0]);
    const offset = parameters[1] === "100%" ? "100%" : Number(parameters[1]);
    const interval = Number(parameters[2]);
    const type = parameters[3] === "T" ? "T" : "F";
    return {
      path,
      offset,
      interval,
      type,
    }
  });
}

export function patternToString(pattern: Pattern): string {
  if (pattern === "solid") {
    return "solid";
  }

  return pattern.map(partToString).join(";");
}

function partToString(part: PatternPart): string {
  return `${Svg.toString(part.path)},${part.offset},${part.interval},${part.type}`;
}
