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
    // The empty path translated by any amount is the empty path
    [[[], 0, 0], []],
    [[[], -10, -10], []],
    [[[], -10, 10], []],
    [[[], 10, -10], []],
    [[[], 10, 10], []],
    // any path from any quadrant translated by 0 is the same
    [[[{ operator: "M", parameters: [-1, -2] }], 0, 0], [{ operator: "M", parameters: [-1, -2] }]],
    [[[{ operator: "M", parameters: [-1, 2] }], 0, 0], [{ operator: "M", parameters: [-1, 2] }]],
    [[[{ operator: "M", parameters: [1, -2] }], 0, 0], [{ operator: "M", parameters: [1, -2] }]],
    [[[{ operator: "M", parameters: [1, 2] }], 0, 0], [{ operator: "M", parameters: [1, 2] }]],
    // translate into each quadrant
    [[[{ operator: "M", parameters: [1, 2, 3, 4] }], -10, -10], [{ operator: "M", parameters: [-9, -8, -7, -6] }]],
    [[[{ operator: "M", parameters: [1, 2, 3, 4] }], -10, 10], [{ operator: "M", parameters: [-9, 12, -7, 14] }]],
    [[[{ operator: "M", parameters: [1, 2, 3, 4] }], 10, -10], [{ operator: "M", parameters: [11, -8, 13, -6] }]],
    [[[{ operator: "M", parameters: [1, 2, 3, 4] }], 10, 10], [{ operator: "M", parameters: [11, 12, 13, 14] }]],
    // translate an L command
    [[[{ operator: "M", parameters: [1, 2] }, { operator: "L", parameters: [3, 4, 5, 6] }], 10, 20], [{ operator: "M", parameters: [11, 22] }, { operator: "L", parameters: [13, 24, 15, 26] }]],
    // translate an H command
    [[[{ operator: "M", parameters: [1, 2] }, { operator: "H", parameters: [3, 4] }], 10, 20], [{ operator: "M", parameters: [11, 22] }, { operator: "H", parameters: [13, 14] }]],
    // translate a V command
    [[[{ operator: "M", parameters: [1, 2] }, { operator: "V", parameters: [3, 4] }], 10, 20], [{ operator: "M", parameters: [11, 22] }, { operator: "V", parameters: [23, 24] }]],
    // translate a C command
    [[[{ operator: "M", parameters: [1, 2] }, { operator: "C", parameters: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14] }], 10, 20], [{ operator: "M", parameters: [11, 22] }, { operator: "C", parameters: [13, 24, 15, 26, 17, 28, 19, 30, 21, 32, 23, 34] }]],
    // translate a S command
    [[[{ operator: "M", parameters: [1, 2] }, { operator: "S", parameters: [3, 4, 5, 6, 7, 8, 9, 10] }], 10, 20], [{ operator: "M", parameters: [11, 22] }, { operator: "S", parameters: [13, 24, 15, 26, 17, 28, 19, 30] }]],
    // translate a Q command
    [[[{ operator: "M", parameters: [1, 2] }, { operator: "Q", parameters: [3, 4, 5, 6, 7, 8, 9, 10] }], 10, 20], [{ operator: "M", parameters: [11, 22] }, { operator: "Q", parameters: [13, 24, 15, 26, 17, 28, 19, 30] }]],
    // translate a T command
    [[[{ operator: "M", parameters: [1, 2] }, { operator: "T", parameters: [3, 4, 5, 6] }], 10, 20], [{ operator: "M", parameters: [11, 22] }, { operator: "T", parameters: [13, 24, 15, 26] }]],
    // translate a A command
    // only the last 2 of 7 parameters should be translated
    [[[{ operator: "M", parameters: [1, 2] }, { operator: "A", parameters: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16] }], 10, 20], [{ operator: "M", parameters: [11, 22] }, { operator: "A", parameters: [3, 4, 5, 6, 7, 18, 29, 10, 11, 12, 13, 14, 25, 36] }]],
    // translate a Z command
    [[[{ operator: "M", parameters: [1, 2] }, { operator: "Z", parameters: [] }], 10, 20], [{ operator: "M", parameters: [11, 22] }, { operator: "Z", parameters: [] }]],
    // test that relative commands do not change
    [[[{ operator: "m", parameters: [1, 2] }, { operator: "l", parameters: [3, 4] }, { operator: "h", parameters: [5] }], 10, 20], [{ operator: "m", parameters: [1, 2] }, { operator: "l", parameters: [3, 4] }, { operator: "h", parameters: [5] }]],
    [[[{ operator: "m", parameters: [1, 2] }, { operator: "v", parameters: [3] }, { operator: "c", parameters: [4, 5, 6, 7, 8, 9] }], 10, 20], [{ operator: "m", parameters: [1, 2] }, { operator: "v", parameters: [3] }, { operator: "c", parameters: [4, 5, 6, 7, 8, 9] }]],
    [[[{ operator: "m", parameters: [1, 2] }, { operator: "s", parameters: [3, 4, 5, 6] }, { operator: "q", parameters: [7, 8, 9, 10] }], 10, 20], [{ operator: "m", parameters: [1, 2] }, { operator: "s", parameters: [3, 4, 5, 6] }, { operator: "q", parameters: [7, 8, 9, 10] }]],
    [[[{ operator: "m", parameters: [1, 2] }, { operator: "t", parameters: [3, 4] }, { operator: "z", parameters: [] }], 10, 20], [{ operator: "m", parameters: [1, 2] }, { operator: "t", parameters: [3, 4] }, { operator: "z", parameters: [] }]],
  ])(
    "translate(%p)",
    (args: [SvgPath, number, number], expected: SvgPath) => {
      expect(Svg.translate(...args)).toEqual(expected);
    }
  )
})