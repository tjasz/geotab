import { parsePattern, PatternPart } from "./Pattern"

describe("parsePattern", () => {
  it.each<[string, PatternPart[]]>([
    ["solid", [{ path: "solid" }]]
  ])(
    "parsePattern(%p)",
    (args: string, expected: PatternPart[]) => {
      expect(parsePattern(args)).toEqual(expected);
    }
  )
})
