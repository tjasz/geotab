
export type SvgPatternWithLabel = {
  label: string;
  pattern: string;
}

export const options: SvgPatternWithLabel[] = [
  { label: "solid", pattern: "solid", },
  { label: "dots", pattern: "M0 0L0 2,2,4,F", },
  { label: "dashes", pattern: "M0 0L0 4,4,8,F", },
  { label: "long dashes", pattern: "M0 0L0 8,8,12,F", },
  { label: "dash-dots", pattern: "M0 0L0 2,8,10,F;M0 4L0 8,8,10,F", },
  { label: "dots under", pattern: "M4 0L4 2,2,4,T", },
  { label: "dashes under", pattern: "M4 0L4 4,4,8,T", },
  { label: "long dashes under", pattern: "M4 0L4 8,8,12,T", },
  { label: "dash-dots under", pattern: "M4 0L4 2,8,10,T;M4 4L4 8,8,10,T", },
  { label: "vertical ticks", pattern: "M-3 0L3 0,10,20,T", },
  { label: "double vertical ticks", pattern: "M-3 0L3 0M-3 4L3 4,10,20,T", },
  { label: "hash at start, hash at end", pattern: "M-4 0L4 0,0,100%,T", },
  { label: "square at start, arrow at end", pattern: "M-4 0 4 0 4 -8 -4 -8Z,0,105%,T;M0 0 4 8 -4 8Z,100%,,T", },
  { label: "circle at start, arrow at end", pattern: "M0 0 A4 4 0 0 0 0 -8A4 4 0 0 0 0 0,0,105%,T;M0 0 4 8 -4 8Z,100%,,T", },
]

// // TODO below might be proprietary to CalTopo, I just want to see that they work
// "solid",
// "M-4 0L4 0,,8,T",
// "M0 -1 L0 1,,8,F",
// "M0 0L 6 0,,10,T",
// "M-6 0L6 0,,10,F",
// "M0 -3 L0 3,,12,F",
// "M-5 3L5 0M-5 -3L5 0,,6,F",
// "M-5 8 L0 -2 L5 8 Z,100%,,T",
// "M-4 -4L-4 4L4 4L4 -4Z,,25,T",
// "M-5 5L0 -5M5 5L0 -5,40,80,T",
// "M-5 5L0 -5M5 5L0 -5,20,40,T",
// "M0 -3 L0 3,0,16,F;M0 -1L0 0,8,16",
// "M-8 -6M8 6M-6 0L0 4L6 0L0 -4Z,,10,F",
// "M-6 0M6 0M-5 -5 L5 5 M5 -5 L-5 5,,10,F",
// "M-6 0M6 0M-5 -5 L5 5 M5 -5 L-5 5,,15,F",
// "M-6 0M6 0M-5 -5 L5 5 M5 -5 L-5 5,7,60,T",
// "M-6 8L0 -8M6 8L0 -8M0 0L-6 8M0 0L6 8,40,80,T",
// "M-6 8L0 -8M6 8L0 -8M0 0L-6 8M0 0L6 8,20,40,T",
// "M-6 14L0 -2M6 14L0 -2M0 6L-6 14M0 6L6 14,100%,,T",
// "M5 5M-5 -5M3 0A3 3 0 1 0 -3 0 A3 3 0 1 0 3 0,,15,F",
// "M4 4M-4 -4M2 0A2 2 0 1 0 -2 0 A2 2 0 1 0 2 0,,15,F",
// "M4 4M-4 -4M2 0A2 2 0 1 0 -2 0 A2 2 0 1 0 2 0,,10,F",
// "M6 6M-6 -6M-5 0L0 5 M5 0L0 5M-5 0L0 -5M5 0L0 -5,,12,F",
// "M5 6L-5 3M5 0L-5 3M5 0L-5 -2M-5 -5L-5 -2M5 -6L-5 -6,,14,F",
// "M12 -7M0 5M9 0A3 3 0 1 0 6 0 A3 3 0 0 0 9 0,2,20,T;M0 0L12 0,15,20",
// "M0 -3 L0 3,,12,F;M4 4M-4 -4M2 0A2 2 0 1 0 -2 0 A2 2 0 1 0 2 0,5,36,F",
// "M-7 0M7 0M-6 0L-2 -4M-6 0L-2 4M2 0L-2 -4M2 0L-2 4M2 0L6 -4M2 0L6 4,,8,F",
// "M-6 5L-4 2M0 0L-4 2M0 0L4 2M6 5L4 2 M-6 -5L-4 -2M0 0L-4 -2M0 0L4 -2M6 -5L4 -2,,16,F",
// "M4 4M-4 -4M2 0A2 2 0 1 0 -2 0 A2 2 0 1 0 2 0,,20,F;M0 5L7 7M-7 13L7 7M-7 13L0 15,0,20",
// "M4 4M-4 -4M2 0A2 2 0 1 0 -2 0 A2 2 0 1 0 2 0,,15,F;M-6 0M6 0M-5 -5 L5 5 M5 -5 L-5 5,7,45,F",
// "M4 4M-4 -4M2 0A2 2 0 1 0 -2 0 A2 2 0 1 0 2 0,,20,F;M-8 6L-4 1M4 6L-4 1M4 6L8 1\tM-8 -1L-4 -6M4 -1L-4 -6M4 -1L8 -6,10,40",
// "M-8 -8M8 8M-7 0L7 0M-5 0L-4 2L-2 4L-1 4L0 6M5 0L4 2L2 4L1 4L0 6M-5 0L-4 -2L-2 -4L-1 -4L0 -6M5 0L4 -2L2 -4L1 -4L0 -6,,30,T",
// "M-12 -12 M12 12 M2 6A2 2 0 1 0 -2 6 A2 2 0 1 0 2 6\t M10 6A2 2 0 1 0 6 6 A2 2 0 0 0 10 6\tM-10 6A2 2 0 1 0 -6 6 A2 2 0 0 0 -10 6\tM6 0A2 2 0 1 0 2 0 A2 2 0 0 0 6 0 M-6 0A2 2 0 1 0 -2 0 A2 2 0 0 0 -6 0\tM2 -6A2 2 0 1 0 -2 -6 A2 2 0 1 0 2 -6,,25,F",
