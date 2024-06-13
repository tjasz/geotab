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
    let leftoverDist = 0;

    for (j = 0, len2 = points.length; j < len2; j++) {
      p = points[j];

      // add tick marks perpendicular to path
      if (j) {
        const tickSize = 10;
        const tickInterval = 20;
        const prevPoint = points[j - 1];
        const segmentBearing = Math.atan2(p.y - prevPoint.y, p.x - prevPoint.x);
        const tickBearing = segmentBearing + Math.PI / 2;
        const tickDx = tickSize * Math.cos(tickBearing);
        const tickDy = tickSize * Math.sin(tickBearing);
        const segmentDist = dist(prevPoint, p);

        // add ticks at regular intervals along this segment
        let k = leftoverDist
        for (; k < segmentDist; k += tickInterval) {
          const pk = moveAlongBearing(prevPoint, k, segmentBearing);
          str += `L ${pk.x} ${pk.y}`;
          str += `m${-tickDx} ${-tickDy} l${2 * tickDx} ${2 * tickDy}`;
          // return to original point
          str += `M${pk.x} ${pk.y}`;
        }
        str += `L${p.x} ${p.y}`;
        leftoverDist = k - segmentDist;
      } else {
        str += `M${p.x} ${p.y}`;
      }
    }

    // closes the ring for polygons
    str += closed ? 'z' : '';
  }

  // SVG complains about empty path strings
  return str || 'M0 0';
}

function moveAlongBearing(p, dist, bearing) {
  return {
    x: p.x + dist * Math.cos(bearing),
    y: p.y + dist * Math.sin(bearing),
  }
}

function dist(p1, p2) {
  return Math.sqrt(square(p1.x - p2.x) + square(p1.y - p2.y));
}

const square = x => x * x;