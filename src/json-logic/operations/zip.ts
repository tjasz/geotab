/**
 * Zips together the values of two arrays.
 *
 * If the sizes of the arrays differs, the resulting array has the same length as `a1`
 * and either the values in `a2` are either repeated to fill the space
 * or `a2` is truncated.
 *
 * `a2` may be a single value instead of an array, in which case that value is repeated
 * and attached to each result object.
 *
 * @param a1 The left-hand arrays, whose values go into property `left` of the zipped objects.
 * @param a2 The right-hand arrays, whose values go into property `right` of the zipped objects.
 * @returns The zipped arrays of objects.
 */
export default function zip(
  a1: unknown[],
  a2: unknown[] | unknown,
): { left: unknown; right: unknown }[] {
  if (Array.isArray(a2)) {
    return a1.map((obj, i) => ({ left: obj, right: a2[i % a2.length] }));
  }

  return a1.map((obj) => ({ left: obj, right: a2 }));
}
