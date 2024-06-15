import L from "leaflet";
import { dist, moveAlongBearing, Point } from "./math";
import { parsePattern, Pattern } from "./Pattern"
import { toString, rotate, translate } from "./Svg";

export const SvgPatternRenderer = L.SVG.extend({
  _updatePoly(layer, closed: boolean) {
    this._setPath(layer, pointsToPatternPath(layer._parts, closed, layer.options.pattern));
  },
  _updateStyle(layer) {
    // @ts-expect-error
    L.SVG.prototype._updateStyle(layer);
    // TODO figure out how to fill the circles on the paths while not filling the whole line area
    //layer._path.setAttribute("fill", layer.options.color);
  }
})

export function pointsToPatternPath(rings: Point[][], closed: boolean, patternString: string) {
  let pattern: Pattern;
  try {
    pattern = parsePattern(patternString);
  }
  catch (error) {
    console.error(error);
    pattern = "solid";
  }

  let str = '',
    i, j, len, len2, points, p: { x: number, y: number };

  // if a polygon, pattern is "solid" or any pattern part has type "T", draw the whole polyline first
  // Note that this means polygons essentially don't support "F" type patterns
  if (closed || pattern === "solid" || pattern.some(part => part.type === "T")) {
    for (i = 0, len = rings.length; i < len; i++) {
      points = rings[i];
      for (j = 0, len2 = points.length; j < len2; j++) {
        p = points[j];
        // If this is the first point of a ring, move the marker to it and draw nothing
        if (!j) {
          str += `M${p.x} ${p.y}`;
        }
        else {
          str += `L${p.x} ${p.y}`;
        }
      }
      // closes the ring for polygons
      str += closed ? 'z' : '';
    }
  }

  // then draw the patterns
  if (pattern !== "solid") {
    for (i = 0, len = rings.length; i < len; i++) {
      points = rings[i];
      let leftoverDistances = pattern.map(p => typeof p.offset === "number" ? p.offset : 0);

      for (j = 1, len2 = points.length; j < len2; j++) {
        p = points[j];

        const prevPoint = points[j - 1];
        const segmentBearing = Math.atan2(p.y - prevPoint.y, p.x - prevPoint.x);
        // TODO this assumes that when offset is 100%, no other pattern parts are defined
        if (pattern[0].offset === "100%") {
          // draw pattern at last point
          str += `M${p.x} ${p.y}`;
          if (j === len2 - 1) {
            str += toString(translate(rotate(pattern[0].path, segmentBearing + Math.PI / 2), p.x, p.y))
          }
        }
        else {
          const segmentDist = dist(prevPoint, p);

          for (let patternPart = 0; patternPart < pattern.length; patternPart++) {
            let k = leftoverDistances[patternPart];
            for (; k < segmentDist; k += pattern[patternPart].interval) {
              const pk = moveAlongBearing(prevPoint, k, segmentBearing);
              // move the marker to this point
              str += `M${pk.x} ${pk.y}`;
              // draw the pattern
              // pattern is defined with positive y as the direction of travel,
              // but these bearings assume positive x is direction of travel, so rotate 90 extra degrees
              str += toString(translate(rotate(pattern[patternPart].path, segmentBearing + Math.PI / 2), pk.x, pk.y))
            }
            // set leftover distance
            leftoverDistances[patternPart] = k - segmentDist;
          }
        }
      }
    }
  }

  // SVG complains about empty path strings
  return str || 'M0 0';
}
