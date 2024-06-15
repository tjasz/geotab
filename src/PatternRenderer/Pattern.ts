import Svg, { SvgPath } from "./Svg"

export type PixelOrPercent = {
  value: number;
  type: "px" | "%";
}
type PatternPart = {
  path: SvgPath;
  offset: PixelOrPercent;
  interval: PixelOrPercent;
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
    const offset = parsePixelOrPercent(parameters[1]);
    const interval = parsePixelOrPercent(parameters[2]);
    const type = parameters[3] === "T" ? "T" : "F";
    return {
      path,
      offset,
      interval,
      type,
    }
  });
}

function parsePixelOrPercent(s: string): PixelOrPercent {
  if (!s || !s.length) {
    return { value: 0, type: "px" };
  }

  if (s.endsWith("%")) {
    const percent = Number(s.slice(0, s.length - 1));
    if (isNaN(percent)) {
      throw new Error(`Invalid pattern. Could not parse ${s} to number or percent.`)
    }
    return { value: percent, type: "%" }
  }

  const value = Number(s.slice(0, s.length - 1));
  if (isNaN(value)) {
    throw new Error(`Invalid pattern. Could not parse ${s} to number or percent.`)
  }
  return { value, type: "px" }
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
