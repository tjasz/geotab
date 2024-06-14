import { square } from "./math";

type SvgCommand = {
  source: string | null;
  operator: string;
  coordinates: number[];
}
type SvgPath = {
  source: string | null;
  commands: SvgCommand[];
}
export function stringPathToJson(path: string): SvgPath {
  const commandStrings = path.trim().split(/(?=[MmZzLlHhVvCcSsQqTtAa])/);
  const commands = commandStrings.map(s => {
    const operator = s[0];
    const coordinateString = s.slice(1).trim();
    const coordinates = coordinateString.length ? coordinateString.split(/[, ]+/).map(v => Number(v)) : [];
    return {
      source: s,
      operator,
      coordinates,
    }
  })
  return { source: path, commands };
}

export function SvgJsonToString(j: SvgPath) {
  let str = "";

  for (const c of j.commands) {
    str += c.operator;
    str += c.coordinates.join(" ");
    str += " ";
  }

  return str.trim();
}

export function translate(p: SvgPath, dx: number, dy: number): SvgPath {
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
            // each arc is defined with 7 parameters where the last two are X and Y
            return {
              source: null, operator: c.operator, coordinates: c.coordinates.map((v, i) => v + (i % 7 === 5 ? dx : i % 7 === 6 ? dy : 0))
            }
          default:
            throw new Error("Invalid SVG command: " + c.operator)
        }
      } else {
        return c;
      }
    }),
  }
}

export function rotate(p: SvgPath, dtheta: number): SvgPath {
  const rotateXY = (x: number, y: number): [number, number] => {
    const magnitude = Math.sqrt(square(x) + square(y));
    const originalBearing = Math.atan2(y, x);
    return [
      magnitude * Math.cos(originalBearing + dtheta),
      magnitude * Math.sin(originalBearing + dtheta)
    ];
  }
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
              const rotation = rotateXY(x, y);
              coordinates.push(rotation[0])
              coordinates.push(rotation[1])
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
            // each arc is defined with 7 parameters where the last two are X and Y
            const arcCoords: number[] = [];
            for (let i = 0; i < c.coordinates.length; i++) {
              if (i % 7 < 5) {
                arcCoords.push(c.coordinates[i]);
              }
              // intentionally do nothing if i % 7 === 5
              else if (i % 7 === 6) {
                const x = c.coordinates[i - 1];
                const y = c.coordinates[i];
                const rotation = rotateXY(x, y);
                arcCoords.push(rotation[0])
                arcCoords.push(rotation[1])
              }
            }
            return { source: null, operator: "A", coordinates: arcCoords }
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
