import L from 'leaflet'
import {dsin, dcos} from './algorithm'

function svgMarker(latlng:L.LatLngExpression, svg:HTMLElement|string) : L.Marker<any> {
  return L.marker(latlng, {icon: svgIcon(svg)});
}

function svgIcon(svg:HTMLElement|string) : L.DivIcon {
  return L.divIcon({
    html: svg,
    className: "",
  });
}

// get the resulting point from traveling r distance from (0,0) at angle a in degrees
function ar(a:number, r:number) : [number, number] {
  return [r*dsin(a), r*dcos(a)]
}

// create the SVG path commands for an n-gon of radius r
function svgPolygon(n:number, r:number, stroke:string, fill:string, text:string) : string {
  let strokeFill = `stroke="${stroke ?? "#336799"}" fill="${fill ?? stroke ?? "#336799"}"`;
  let str = `<svg width="${2*r}" height="${2*r}" viewBox="-50 -50 100 100" xmlns="http://www.w3.org/2000/svg">`;
  if (n === Infinity) { // circle
    str += `<circle cx="0" cy="0" r="50" ${strokeFill} />`;
  } else {
    let points:[number, number][] = []
    const da = 360.0/n;
    for (let a = da/2; a < 360.0; a += da) {
      points.push(ar(a, 50)); // hardcode 50 if viewbox is 100x100
    }
    let cmds = "M" + points[0][0] + " " + points[0][1];
    for (let i = 1; i < points.length; i++) {
      cmds += " L" + points[i][0] + " " + points[i][1];
    }
    cmds += "Z";
    str += `<path d="${cmds}" ${strokeFill} />`;
  }
  if (text) {
    str += `<text x="50" y="50" font-size="100"  dominant-baseline="middle" text-anchor="middle">${text}</text>`;
  }
  str += "</svg>";
  return str;
}

export function PolygonMarker(latlng:L.LatLngExpression, n:number, r:number, stroke:string, fill:string, text:string) : L.Marker<any> {
  return svgMarker(
    latlng,
    svgPolygon(n, r, stroke, fill, text)
  );
}

// create the SVG path commands for an n-star of radius r
function svgStar(n:number, r:number, stroke:string, fill:string, text:string) : string {
  let strokeFill = `stroke="${stroke ?? "#336799"}" fill="${fill ?? stroke ?? "#336799"}"`;
  let str = `<svg width="${2*r}" height="${2*r}" viewBox="-50 -50 100 100" xmlns="http://www.w3.org/2000/svg">`;
  if (n === Infinity) { // circle
    str += `<circle cx="0" cy="0" r="50" ${strokeFill} />`;
  } else {
    let points : [number,number][] = []
    const da = 360.0/(2*n);
    for (let a = 0; a < 360.0; a += da) {
      points.push(ar(a, (n % 2 === points.length % 2) ? 50 : 25)); // hardcode if viewbox is 100x100
    }
    let cmds = "M" + points[0][0] + " " + points[0][1];
    for (let i = 1; i < points.length; i++) {
      cmds += " L" + points[i][0] + " " + points[i][1];
    }
    cmds += "Z";
    str += `<path d="${cmds}" ${strokeFill} />`;
  }
  if (text) {
    str += `<text x="0" y="0" font-size="50"  dominant-baseline="middle" text-anchor="middle">${text}</text>`;
  }
  str += "</svg>";
  return str;
}

export function StarMarker(latlng:L.LatLngExpression, n:number, r:number, stroke:string, fill:string, text:string) : L.Marker<any> {
  return svgMarker(
    latlng,
    svgStar(n, r, stroke, fill, text)
  );
}