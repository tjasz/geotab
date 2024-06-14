type PatternPart = {
  path: string;
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
    const path = parameters[0];
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
