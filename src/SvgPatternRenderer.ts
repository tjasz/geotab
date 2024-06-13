import L from "leaflet";

export const SvgPatternRenderer = L.SVG.extend({
  _updatePoly(layer, closed) {
    this._setPath(layer, pointsToPatternPath(layer._parts, closed));
  },
})

function pointsToPatternPath(rings, closed) {
  let str = '',
    i, j, len, len2, points, p;

  for (i = 0, len = rings.length; i < len; i++) {
    points = rings[i];

    for (j = 0, len2 = points.length; j < len2; j++) {
      p = points[j];
      str += `${(j ? 'L' : 'M') + p.x} ${p.y}`;
    }

    // closes the ring for polygons
    str += closed ? 'z' : '';
  }

  // SVG complains about empty path strings
  return str || 'M0 0';
}