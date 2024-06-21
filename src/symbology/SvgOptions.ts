export type SvgPatternWithLabel = {
  label: string;
  pattern: string;
}

export type SvgOptions = { [group: string]: SvgPatternWithLabel[] };