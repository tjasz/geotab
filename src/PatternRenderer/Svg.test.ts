import Svg, { SvgPath } from "./Svg";

describe("in some special cases, toString(parse(s)) should not equal s", () => {
  it.each<[string, string]>([
    // the empty path still needs to have a marker defined
    ["", "M0 0"],
    // trailing zeros of decimals will be cut off by Number() conversion
    ["M0.00 0.000", "M0 0"],
    // negative 0 will be converted to 0 by Number()
    ["M-0 -0", "M0 0"],
    // excessive commas and spaces will be removed
    ["M 0, 0 L 1, 2", "M0 0L1 2"]
  ])(
    "Svg.parse(%p)",
    (input: string, expected: string) => {
      expect(Svg.toString(Svg.parse(input))).toEqual(expected);
    }
  )
})

describe("in most cases, toString(parse(s)) should equal s, as functions are lossless", () => {
  it.each<string>([
    // ensure negatives, decimals, and multiple commands are handled
    "M1 2L-3 -4V8.05H2.05Z",
    // ensure every command type can be handled
    "M1 2L3 4H5V6C7 8 9 10 11 12S13 14 15 16Q17 18 19 20T21 22A23 24 25 26 27 28 29Z",
    "m1 2l3 4h5v6c7 8 9 10 11 12s13 14 15 16q17 18 19 20t21 22a23 24 25 26 27 28 29z",
  ])(
    "Svg.parse(%p)",
    (path: string) => {
      expect(Svg.toString(Svg.parse(path))).toEqual(path);
    }
  )
})

describe("translate", () => {
  it.each<[[SvgPath, number, number], SvgPath]>([

  ])(
    "translate(%p)",
    (args: [SvgPath, number, number], expected: SvgPath) => {
      expect(Svg.translate(...args)).toEqual(expected);
    }
  )
})