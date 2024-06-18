import { Point, rotateAroundOrigin } from "./math";

export type SvgCommand = {
  operator: string;
  parameters: number[];
}

export type SvgPath = SvgCommand[];

export function parse(path: string): SvgPath {
  if (!path || !path.length) {
    return [{ operator: "M", parameters: [0, 0] }];
  }

  const invalidCharacters = path.match(/[^ \tMmZzLlHhVvCcSsQqTtAa0-9,.-]/);
  if (invalidCharacters?.length) {
    throw new Error(`Invalid SVG contains non-allowed character '${invalidCharacters.join("")}': ${path}`)
  }

  const commandStrings = path.trim().split(/(?=[MmZzLlHhVvCcSsQqTtAa])/);
  const commands = commandStrings.map(s => {
    const operator = s[0];
    const parametersString = s.slice(1).trim();
    const parameters = parametersString.length ? parametersString.split(/[, ]+/).map(v => {
      const n = Number(v);
      if (isNaN(n)) {
        throw new Error("SVG path command parameter was not a number: " + v)
      }
      return n;
    }) : [];
    return {
      operator,
      parameters,
    }
  })
  return commands;
}

export function toString(j: SvgPath) {
  let str = "";

  for (const c of j) {
    str += c.operator;
    str += c.parameters.join(" ");
  }

  return str.trim();
}

export function translate(p: SvgPath, dx: number, dy: number): SvgPath {
  const result = p.map(c => {
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
            operator: c.operator, parameters: c.parameters.map((v, i) => v + (i % 2 ? dy : dx))
          }
        // commands with just x coordinates
        case "H":
          return { operator: c.operator, parameters: c.parameters.map(x => x + dx) }
        // commands with just y coordinates
        case "V":
          return { operator: c.operator, parameters: c.parameters.map(y => y + dy) }
        // commands with no coordinates
        case "Z":
          return c;
        // the arc command
        case "A":
          // each arc is defined with 7 parameters where the last two are X and Y
          return {
            operator: c.operator, parameters: c.parameters.map((v, i) => v + (i % 7 === 5 ? dx : i % 7 === 6 ? dy : 0))
          }
        default:
          throw new Error("Invalid SVG command: " + c.operator)
      }
    } else {
      return c;
    }
  });
  return result;
}

export function scale(p: SvgPath, factor: number): SvgPath {
  const result = p.map(c => {
    switch (c.operator.charAt(0)) {
      case "A":
      case "a":
        return { ...c, parametetrs: c.parameters.map((v, i) => (i % 7) >= 2 && (i % 7) <= 4 ? v : v * factor) }
      default:
        return { ...c, parameters: c.parameters.map(v => v * factor) }
    }
  })
  return result;
}

export function rotate(p: SvgPath, dtheta: number): SvgPath {
  if (p.some(c => !isAbsolute(c) || c.operator === "H" || c.operator === "V")) {
    p = toAbsoluteAndRemoveHV(p);
  }
  const result = p.map(c => {
    if (isAbsolute(c)) {
      switch (c.operator.charAt(0)) {
        // commands with x and y coordinates
        case "M":
        case "L":
        case "C":
        case "S":
        case "Q":
        case "T":
          const parameters: number[] = [];
          for (let i = 1; i < c.parameters.length; i += 2) {
            const x = c.parameters[i - 1];
            const y = c.parameters[i];
            const rotation = rotateAroundOrigin({ x, y }, dtheta);
            parameters.push(rotation.x)
            parameters.push(rotation.y)
          }
          return {
            operator: c.operator, parameters
          }
        // commands with just x coordinates
        case "H":
          throw new Error("TODO Rotation of H command not implemented. Need to track previous Y coordinate.")
        // commands with just y coordinates
        case "V":
          throw new Error("TODO Rotation of V command not implemented. Need to track previous X coordinate.")
        // commands with no coordinates
        case "Z":
          return c;
        // the arc command
        case "A":
          // each arc is defined with 7 parameters where the last two are X and Y
          const arcCoords: number[] = [];
          for (let i = 0; i < c.parameters.length; i++) {
            if (i % 7 < 5) {
              arcCoords.push(c.parameters[i]);
            }
            // intentionally do nothing if i % 7 === 5
            else if (i % 7 === 6) {
              const x = c.parameters[i - 1];
              const y = c.parameters[i];
              const rotation = rotateAroundOrigin({ x, y }, dtheta);
              arcCoords.push(rotation.x)
              arcCoords.push(rotation.y)
            }
          }
          return { operator: "A", parameters: arcCoords }
        default:
          throw new Error("Invalid SVG command: " + c.operator)
      }
    } else {
      throw new Error("TODO rotation of relative commands not implemented.")
    }
  });
  return result;
}

// convert a path's commands to all absolute commands
// and replace H and V commands with L commands
function toAbsoluteAndRemoveHV(path: SvgPath): SvgPath {
  let subpathStart: Point = { x: 0, y: 0 };
  let marker: Point = { x: 0, y: 0 };
  const commands: SvgCommand[] = [];
  for (let i = 0; i < path.length; i++) {
    const c = path[i];
    if (isAbsolute(c)) {
      switch (c.operator) {
        case "M":
          marker = { x: c.parameters[c.parameters.length - 2], y: c.parameters[c.parameters.length - 1] };
          subpathStart = marker;
          commands.push(c);
          break;
        case "L":
        case "C":
        case "S":
        case "Q":
        case "T":
        case "A":
          marker = { x: c.parameters[c.parameters.length - 2], y: c.parameters[c.parameters.length - 1] };
          commands.push(c);
          break;
        case "H":
          marker = { x: c.parameters[c.parameters.length - 1], y: marker.y };
          commands.push({ operator: "L", parameters: c.parameters.map(x => [x, marker.y]).flat() });
          break;
        case "V":
          marker = { x: marker.x, y: c.parameters[c.parameters.length - 1] };
          commands.push({ operator: "L", parameters: c.parameters.map(y => [marker.x, y]).flat() });
          commands.push(c);
          break;
        case "Z":
          marker = subpathStart;
          commands.push(c);
          break;
        default:
          throw new Error("Invalid SVG command: " + c.operator);
      }
    }
    else {
      // update marker and push command(s)
      switch (c.operator) {
        case "m":
          for (let j = 1; j < c.parameters.length; j += 2) {
            marker = { x: marker.x + c.parameters[j - 1], y: marker.y + c.parameters[j] };
            subpathStart = marker;
            commands.push({ operator: c.operator.toUpperCase(), parameters: [marker.x, marker.y] })
          }
          break;
        case "l":
        case "t":
          for (let j = 1; j < c.parameters.length; j += 2) {
            marker = { x: marker.x + c.parameters[j - 1], y: marker.y + c.parameters[j] };
            commands.push({ operator: c.operator.toUpperCase(), parameters: [marker.x, marker.y] })
          }
          break;
        case "h":
          for (let j = 0; j < c.parameters.length; j++) {
            marker = { x: marker.x + c.parameters[j], y: marker.y };
            commands.push({ operator: "L", parameters: c.parameters.map(x => [x, marker.y]).flat() });
          }
          break;
        case "v":
          for (let j = 0; j < c.parameters.length; j++) {
            marker = { x: marker.x, y: marker.y + c.parameters[j] };
            commands.push({ operator: "L", parameters: c.parameters.map(y => [marker.x, y]).flat() });
          }
          break;
        case "c":
          for (let j = 5; j < c.parameters.length; j += 6) {
            marker = { x: marker.x + c.parameters[j - 1], y: marker.y + c.parameters[j] };
            commands.push({
              operator: c.operator.toUpperCase(), parameters: [
                marker.x + c.parameters[j - 5],
                marker.y + c.parameters[j - 4],
                marker.x + c.parameters[j - 3],
                marker.y + c.parameters[j - 2],
                marker.x,
                marker.y
              ]
            })
          }
          break;
        case "s":
        case "q":
          for (let j = 3; j < c.parameters.length; j += 4) {
            marker = { x: marker.x + c.parameters[j - 1], y: marker.y + c.parameters[j] };
            commands.push({
              operator: c.operator.toUpperCase(), parameters: [
                marker.x + c.parameters[j - 3],
                marker.y + c.parameters[j - 2],
                marker.x,
                marker.y
              ]
            })
          }
          break;
        case "a":
          for (let j = 6; j < c.parameters.length; j += 7) {
            marker = { x: marker.x + c.parameters[j - 1], y: marker.y + c.parameters[j] };
            commands.push({
              operator: c.operator.toUpperCase(), parameters: [
                c.parameters[j - 6],
                c.parameters[j - 5],
                c.parameters[j - 4],
                c.parameters[j - 3],
                c.parameters[j - 2],
                marker.x,
                marker.y
              ]
            })
          }
          break;
        case "z":
          marker = subpathStart;
          commands.push({ operator: c.operator.toUpperCase(), parameters: [] });
          break;
        default:
          throw new Error("Invalid SVG command: " + c.operator);
      }
    }
  }

  return commands;
}

function isAbsolute(c: SvgCommand) {
  switch (c.operator) {
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

const Svg = {
  parse,
  toString,
  rotate,
  scale,
  translate,
}
export default Svg;