import { parsePattern, Pattern } from "./Pattern"

// Ensure the 33 patterns defined by CalTopo are correctly parsed
describe("CalTopo", () => {
  it.each<[string, Pattern]>([
    ["solid", "solid"],
    [
      "M-4 0L4 0,,8,T",
      [
        {
          path: {
            commands:
              [
                { operator: "M", parameters: [-4, 0] },
                { operator: "L", parameters: [4, 0] },
              ]
          },
          offset: 0,
          interval: 8,
          type: "T"
        }
      ]
    ],
    [
      "M0 -1 L0 1,,8,F",
      [
        {
          path: {
            commands:
              [
                { operator: "M", parameters: [0, -1] },
                { operator: "L", parameters: [0, 1] },
              ]
          },
          offset: 0,
          interval: 8,
          type: "F"
        }
      ]
    ],
    [
      "M0 0L 6 0,,10,T",
      [
        {
          path: {
            commands:
              [
                { operator: "M", parameters: [0, 0] },
                { operator: "L", parameters: [6, 0] }
              ]
          },
          offset: 0,
          interval: 10,
          type: "T"
        }
      ]
    ],
    [
      "M-6 0L6 0,,10,F",
      [
        {
          path: {
            commands:
              [
                { operator: "M", parameters: [-6, 0] },
                { operator: "L", parameters: [6, 0] }
              ]
          },
          offset: 0,
          interval: 10,
          type: "F"
        }
      ]
    ],
    [
      "M0 -3 L0 3,,12,F",
      [
        {
          path: {
            commands:
              [
                { operator: "M", parameters: [0, -3] },
                { operator: "L", parameters: [0, 3] }
              ]
          },
          offset: 0,
          interval: 12,
          type: "F"
        }
      ]
    ],
    [
      "M-5 3L5 0M-5 -3L5 0,,6,F",
      [
        {
          path: {
            commands:
              [
                { operator: "M", parameters: [-5, 3] },
                { operator: "L", parameters: [5, 0] },
                { operator: "M", parameters: [-5, -3] },
                { operator: "L", parameters: [5, 0] },
              ]
          },
          offset: 0,
          interval: 6,
          type: "F"
        }
      ]
    ],
    [
      "M-5 8 L0 -2 L5 8 Z,100%,,T",
      [
        {
          path: {
            commands:
              [
                { operator: "M", parameters: [-5, 8] },
                { operator: "L", parameters: [0, -2] },
                { operator: "L", parameters: [5, 8] },
                { operator: "Z", parameters: [] },
              ]
          },
          offset: "100%",
          interval: 0,
          type: "T"
        }
      ]
    ],
    [
      "M-5 5L0 -5M5 5L0 -5,40,80,T",
      [
        {
          path: {
            commands:
              [
                { operator: "M", parameters: [-5, 5] },
                { operator: "L", parameters: [0, -5] },
                { operator: "M", parameters: [5, 5] },
                { operator: "L", parameters: [0, -5] },
              ]
          },
          offset: 40,
          interval: 80,
          type: "T"
        }
      ]
    ],
    [
      "M-5 5L0 -5M5 5L0 -5,20,40,T",
      [
        {
          path: {
            commands:
              [
                { operator: "M", parameters: [-5, 5] },
                { operator: "L", parameters: [0, -5] },
                { operator: "M", parameters: [5, 5] },
                { operator: "L", parameters: [0, -5] },
              ]
          },
          offset: 20,
          interval: 40,
          type: "T"
        }
      ]
    ],
    [
      "M-4 -4L-4 4L4 4L4 -4Z,,25,T",
      [
        {
          path: {
            commands:
              [
                { operator: "M", parameters: [-4, -4] },
                { operator: "L", parameters: [-4, 4] },
                { operator: "L", parameters: [4, 4] },
                { operator: "L", parameters: [4, -4] },
                { operator: "Z", parameters: [] },
              ]
          },
          offset: 0,
          interval: 25,
          type: "T"
        }
      ]
    ],
    [
      "M0 -3 L0 3,0,16,F;M0 -1L0 0,8,16",
      [
        {
          path: {
            commands:
              [
                { operator: "M", parameters: [0, -3] },
                { operator: "L", parameters: [0, 3] }
              ]
          },
          offset: 0,
          interval: 16,
          type: "F"
        },
        {
          path: {
            commands:
              [
                { operator: "M", parameters: [0, -1] },
                { operator: "L", parameters: [0, 0] }
              ]
          },
          offset: 8,
          interval: 16,
          type: "F"
        }
      ]
    ],
    ["M-8 -6M8 6M-6 0L0 4L6 0L0 -4Z,,10,F", [{ path: { commands: [] }, offset: 0, interval: 8, type: "T" }]],
    ["M-6 0M6 0M-5 -5 L5 5 M5 -5 L-5 5,,10,F", [{ path: { commands: [] }, offset: 0, interval: 8, type: "T" }]],
    ["M-6 0M6 0M-5 -5 L5 5 M5 -5 L-5 5,,15,F", [{ path: { commands: [] }, offset: 0, interval: 8, type: "T" }]],
    ["M-6 0M6 0M-5 -5 L5 5 M5 -5 L-5 5,7,60,T", [{ path: { commands: [] }, offset: 0, interval: 8, type: "T" }]],
    ["M-6 8L0 -8M6 8L0 -8M0 0L-6 8M0 0L6 8,40,80,T", [{ path: { commands: [] }, offset: 0, interval: 8, type: "T" }]],
    ["M-6 8L0 -8M6 8L0 -8M0 0L-6 8M0 0L6 8,20,40,T", [{ path: { commands: [] }, offset: 0, interval: 8, type: "T" }]],
    ["M-6 14L0 -2M6 14L0 -2M0 6L-6 14M0 6L6 14,100%,,T", [{ path: { commands: [] }, offset: 0, interval: 8, type: "T" }]],
    ["M5 5M-5 -5M3 0A3 3 0 1 0 -3 0 A3 3 0 1 0 3 0,,15,F", [{ path: { commands: [] }, offset: 0, interval: 8, type: "T" }]],
    ["M4 4M-4 -4M2 0A2 2 0 1 0 -2 0 A2 2 0 1 0 2 0,,15,F", [{ path: { commands: [] }, offset: 0, interval: 8, type: "T" }]],
    ["M4 4M-4 -4M2 0A2 2 0 1 0 -2 0 A2 2 0 1 0 2 0,,10,F", [{ path: { commands: [] }, offset: 0, interval: 8, type: "T" }]],
    ["M6 6M-6 -6M-5 0L0 5 M5 0L0 5M-5 0L0 -5M5 0L0 -5,,12,F", [{ path: { commands: [] }, offset: 0, interval: 8, type: "T" }]],
    ["M5 6L-5 3M5 0L-5 3M5 0L-5 -2M-5 -5L-5 -2M5 -6L-5 -6,,14,F", [{ path: { commands: [] }, offset: 0, interval: 8, type: "T" }]],
    ["M12 -7M0 5M9 0A3 3 0 1 0 6 0 A3 3 0 0 0 9 0,2,20,T;M0 0L12 0,15,20", [{ path: { commands: [] }, offset: 0, interval: 8, type: "T" }]],
    ["M0 -3 L0 3,,12,F;M4 4M-4 -4M2 0A2 2 0 1 0 -2 0 A2 2 0 1 0 2 0,5,36,F", [{ path: { commands: [] }, offset: 0, interval: 8, type: "T" }]],
    ["M-7 0M7 0M-6 0L-2 -4M-6 0L-2 4M2 0L-2 -4M2 0L-2 4M2 0L6 -4M2 0L6 4,,8,F", [{ path: { commands: [] }, offset: 0, interval: 8, type: "T" }]],
    ["M-6 5L-4 2M0 0L-4 2M0 0L4 2M6 5L4 2 M-6 -5L-4 -2M0 0L-4 -2M0 0L4 -2M6 -5L4 -2,,16,F", [{ path: { commands: [] }, offset: 0, interval: 8, type: "T" }]],
    ["M4 4M-4 -4M2 0A2 2 0 1 0 -2 0 A2 2 0 1 0 2 0,,20,F;M0 5L7 7M-7 13L7 7M-7 13L0 15,0,20", [{ path: { commands: [] }, offset: 0, interval: 8, type: "T" }]],
    ["M4 4M-4 -4M2 0A2 2 0 1 0 -2 0 A2 2 0 1 0 2 0,,15,F;M-6 0M6 0M-5 -5 L5 5 M5 -5 L-5 5,7,45,F", [{ path: { commands: [] }, offset: 0, interval: 8, type: "T" }]],
    ["M4 4M-4 -4M2 0A2 2 0 1 0 -2 0 A2 2 0 1 0 2 0,,20,F;M-8 6L-4 1M4 6L-4 1M4 6L8 1 M-8 -1L-4 -6M4 -1L-4 -6M4 -1L8 -6,10,40", [{ path: { commands: [] }, offset: 0, interval: 8, type: "T" }]],
    ["M-8 -8M8 8M-7 0L7 0M-5 0L-4 2L-2 4L-1 4L0 6M5 0L4 2L2 4L1 4L0 6M-5 0L-4 -2L-2 -4L-1 -4L0 -6M5 0L4 -2L2 -4L1 -4L0 -6,,30,T", [{ path: { commands: [] }, offset: 0, interval: 8, type: "T" }]],
    ["M-12 -12 M12 12 M2 6A2 2 0 1 0 -2 6 A2 2 0 1 0 2 6 M10 6A2 2 0 1 0 6 6 A2 2 0 0 0 10 6 M-10 6A2 2 0 1 0 -6 6 A2 2 0 0 0 -10 6 M6 0A2 2 0 1 0 2 0 A2 2 0 0 0 6 0 M-6 0A2 2 0 1 0 -2 0 A2 2 0 0 0 -6 0 M2 -6A2 2 0 1 0 -2 -6 A2 2 0 1 0 2 -6,,25,F", [{ path: { commands: [] }, offset: 0, interval: 8, type: "T" }]],
  ])(
    "parsePattern(%p)",
    (args: string, expected: Pattern) => {
      expect(parsePattern(args)).toEqual(expected);
    }
  )
})
