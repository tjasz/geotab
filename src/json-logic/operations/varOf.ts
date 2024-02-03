/**
 * Get the subproperty at the given path of an object.
 *
 * @param pathString A period-delimited string giving the path of the subproperty to access.
 * @param data The object or array to access the subproperty of.
 * @param fallback A value to return if one is not found at the given path.
 * @returns The property at the given path or the fallback.
 */
export default function varOf(pathString : string, data : unknown, fallback : unknown) : unknown
{
  const defaultValue = (fallback === undefined) ? null : fallback;

  if (typeof pathString === "undefined" || pathString === "" || pathString === null) {
    return data;
  }

  var sub_props = String(pathString).split(".");
  for (var i = 0; i < sub_props.length; i++) {
    if (data === null || data === undefined) {
      return defaultValue;
    }
    // Descending into data
    data = data[sub_props[i]];
    if (data === undefined) {
      return defaultValue;
    }
  }

  return data;
}