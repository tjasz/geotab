export type PatternPart = {
  path: string; // SVG path string or "solid"
  offset?: number | "100%";
  interval?: number;
  type?: string; // "F" | "T"
};

export function parsePattern(s: string): PatternPart[] {
  if (s === "solid") {
    return [{ path: "solid" }]
  }

  const patternParts = s.split(";");
  return patternParts.map(part => {
    const parameters = part.split(",");
    const path = parameters[0];
    const offset = parameters[1] === "100%" ? "100%" : Number(parameters[1]);
    const interval = Number(parameters[2]);
    const type = parameters[3];
    return {
      path,
      offset,
      interval,
      type,
    }
  });
}
