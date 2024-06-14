import L from "leaflet";
import { dist, moveAlongBearing } from "./math";
import { parsePattern } from "./Pattern"
import { toString, rotate, translate } from "./Svg";

export const SvgPatternRenderer = L.SVG.extend({
  _updatePoly(layer, closed) {
    this._setPath(layer, pointsToPatternPath(layer._parts, closed, layer.options.pattern));
  },
  _updateStyle(layer) {
    // @ts-expect-error
    L.SVG.prototype._updateStyle(layer);
    layer._path.setAttribute("fill", layer.options.color);
  }
})

function pointsToPatternPath(rings, closed: boolean, pattern: string) {
  const patternOptions = parsePattern(pattern);

  let str = '',
    i, j, len, len2, points, p: { x: number, y: number };

  if (patternOptions === "solid") {
    for (i = 0, len = rings.length; i < len; i++) {
      points = rings[i];
      for (j = 0, len2 = points.length; j < len2; j++) {
        p = points[j];
        if (j) {
          str += `L${p.x} ${p.y}`;
        }
        else {
          str += `M${p.x} ${p.y}`;
        }
      }
    }
  }
  else {
    for (i = 0, len = rings.length; i < len; i++) {
      points = rings[i];
      let leftoverDistances = patternOptions.map(p => typeof p.offset === "number" ? p.offset : 0);

      for (j = 0, len2 = points.length; j < len2; j++) {
        p = points[j];

        if (j) {
          // TODO this assumes that when offset is 100%, the type is T and no other pattern parts are defined
          if (patternOptions[0].offset === "100%") {
            str += `L${p.x} ${p.y}`;
            // draw pattern at last point
            if (j === len2 - 1) {
              const prevPoint = points[j - 1];
              const segmentBearing = Math.atan2(p.y - prevPoint.y, p.x - prevPoint.x);
              str += toString(translate(rotate(patternOptions[0].path, segmentBearing + Math.PI / 2), p.x, p.y))
            }
          }
          else {
            const prevPoint = points[j - 1];
            const segmentBearing = Math.atan2(p.y - prevPoint.y, p.x - prevPoint.x);
            const segmentDist = dist(prevPoint, p);

            for (let patternPart = 0; patternPart < patternOptions.length; patternPart++) {
              let k = leftoverDistances[patternPart];
              for (; k < segmentDist; k += patternOptions[patternPart].interval ?? 20) {
                const pk = moveAlongBearing(prevPoint, k, segmentBearing);
                // move the marker to this point
                str += `${patternOptions[patternPart].type === "F" ? "M" : "L"}${pk.x} ${pk.y}`;
                // draw the pattern
                // pattern is defined with positive y as the direction of travel,
                // but these bearings assume positive x is direction of travel, so rotate 90 extra degrees
                str += toString(translate(rotate(patternOptions[patternPart].path, segmentBearing + Math.PI / 2), pk.x, pk.y))
                // return to original point
                str += `M${pk.x} ${pk.y}`;
              }
              // set leftover distance and move to end of segment
              str += `${patternOptions[patternPart].type === "F" ? "M" : "L"}${p.x} ${p.y}`;
              leftoverDistances[patternPart] = k - segmentDist;
            }
          }
        } else {
          str += `M${p.x} ${p.y}`;
        }
      }

      // closes the ring for polygons
      console.log(str)
      str += closed ? 'z' : '';
    }
  }

  // SVG complains about empty path strings
  return str || 'M0 0';
}
