import L from "leaflet";

export const SvgPatternRenderer = L.SVG.extend({
  _updatePoly(layer, closed) {
    this._setPath(layer, pointsToPatternPath(layer._parts, closed, layer.options.pattern));
  },
})

function pointsToPatternPath(rings, closed: boolean, pattern: string) {
  const patternParts = pattern.split(",");
  const tickPath = patternParts[0];
  const tickOffset = Number(patternParts[1]);
  const tickInterval = Number(patternParts[2]);
  const tickType = patternParts[3];

  let str = '',
    i, j, len, len2, points, p;

  for (i = 0, len = rings.length; i < len; i++) {
    points = rings[i];
    let leftoverDist = 0;

    for (j = 0, len2 = points.length; j < len2; j++) {
      p = points[j];

      // add tick marks perpendicular to path
      if (j) {
        const prevPoint = points[j - 1];
        const segmentBearing = Math.atan2(p.y - prevPoint.y, p.x - prevPoint.x);
        const segmentDist = dist(prevPoint, p);

        // add ticks at regular intervals along this segment
        let k = leftoverDist
        for (; k < segmentDist; k += tickInterval) {
          const pk = moveAlongBearing(prevPoint, k, segmentBearing);
          // move the marker to this point
          str += `M${pk.x} ${pk.y}`;
          // draw the pattern
          str += SvgJsonToString(translate(rotate(stringPathToJson(tickPath), segmentBearing + Math.PI / 2), pk.x, pk.y))
          // return to original point
          str += `M${pk.x} ${pk.y}`;
        }
        str += `M${p.x} ${p.y}`;
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

type SvgCommand = {
  source: string | null;
  operator: string;
  coordinates: number[];
}
type SvgPath = {
  source: string | null;
  commands: SvgCommand[];
}
function stringPathToJson(path: string): SvgPath {
  const commandStrings = path.trim().split(/(?=[MmZzLlHhVvCcSsQqTtAa])/);
  const commands = commandStrings.map(s => {
    const operator = s[0];
    const coordinates = s.slice(1).trim().split(/[, ]+/).map(v => Number(v));
    return {
      source: s,
      operator,
      coordinates,
    }
  })
  return { source: path, commands };
}

function SvgJsonToString(j: SvgPath) {
  let str = "";

  for (const c of j.commands) {
    str += c.operator;
    str += c.coordinates.join(" ");
    str += " ";
  }

  return str.trim();
}

function translate(p: SvgPath, dx: number, dy: number): SvgPath {
  return {
    source: null,
    commands: p.commands.map(c => {
      if (isAbsolute(c)) {
        switch (c.operator.charAt(0)) {
          // commands with x and y coordinates
          case "M":
          case "L":
          case "C":
          case "S":
          case "Q":
          case "T":
            return {
              source: null, operator: c.operator, coordinates: c.coordinates.map((v, i) => v + (i % 2 ? dy : dx))
            }
          // commands with just x coordinates
          case "H":
            return { source: null, operator: c.operator, coordinates: c.coordinates.map(x => x + dx) }
          // commands with just y coordinates
          case "V":
            return { source: null, operator: c.operator, coordinates: c.coordinates.map(y => y + dy) }
          // commands with no coordinates
          case "Z":
            return c;
          // the arc command
          case "A":
            throw new Error("TODO Arc command translation not implemented.")
          default:
            throw new Error("Invalid SVG command: " + c.operator)
        }
      } else {
        return c;
      }
    }),
  }
}

function rotate(p: SvgPath, dtheta: number): SvgPath {
  const result = {
    source: null,
    commands: p.commands.map(c => {
      if (isAbsolute(c)) {
        switch (c.operator.charAt(0)) {
          // commands with x and y coordinates
          case "M":
          case "L":
          case "C":
          case "S":
          case "Q":
          case "T":
            const coordinates: number[] = [];
            for (let i = 1; i < c.coordinates.length; i += 2) {
              const x = c.coordinates[i - 1];
              const y = c.coordinates[i];
              const magnitude = Math.sqrt(square(x) + square(y));
              const originalBearing = Math.atan2(y, x);
              coordinates.push(magnitude * Math.cos(originalBearing + dtheta));
              coordinates.push(magnitude * Math.sin(originalBearing + dtheta));
            }
            return {
              source: null, operator: c.operator, coordinates
            }
          // commands with just x coordinates
          case "H":
            return { source: null, operator: "L", coordinates: c.coordinates.map(x => [x * Math.cos(dtheta), x * Math.sin(dtheta)]).flat() }
          // commands with just y coordinates
          case "V":
            return { source: null, operator: "L", coordinates: c.coordinates.map(y => [y * Math.cos(dtheta + Math.PI / 2), y * Math.sin(dtheta + Math.PI / 2)]).flat() }
          // commands with no coordinates
          case "Z":
            return c;
          // the arc command
          case "A":
            throw new Error("TODO Arc command rotation not implemented.")
          default:
            throw new Error("Invalid SVG command: " + c.operator)
        }
      } else {
        throw new Error("TODO rotation of relative commands not implemented.")
      }
    }),
  };
  return result;
}

function isAbsolute(c: SvgCommand) {
  switch (c.operator.charAt(0)) {
    case "M":
    case "Z":
    case "L":
    case "H":
    case "V":
    case "C":
    case "S":
    case "Q":
    case "T":
    case "A":
      return true;
    case "m":
    case "z":
    case "l":
    case "h":
    case "v":
    case "c":
    case "s":
    case "q":
    case "t":
    case "a":
      return false;
    default:
      throw new Error("Invalid SVG command: " + c.operator);
  }
}