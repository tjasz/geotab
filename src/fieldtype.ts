export enum FieldTypeDescription {
  Number = "number",
  Date = "date",
  String = "string",
  Any = "any",
}

export function toNumber(v: any): number {
  if (typeof v === "number") {
    return v;
  }
  if (v instanceof Date) {
    return v.getTime();
  }
  return Number(v);
}

export function toDate(v: any): Date {
  if (v instanceof Date) {
    return v;
  }
  if (typeof v === "number") {
    return new Date(v);
  }
  if (typeof v === "string") {
    const isnum = v.match(/^[0-9]+$/) != null;
    return new Date(isnum ? Number(v) : Date.parse(v));
  }
  return new Date(v);
}

export function toString(v: any): string {
  return typeof v === "string" ? v : JSON.stringify(v);
}

export function toType(v: any, type: string) {
  switch (type) {
    case "string":
      return toString(v);
    case "number":
      return toNumber(v);
    case "date":
      return toDate(v);
    default:
      return v;
  }
}
