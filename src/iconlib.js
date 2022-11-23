import L from 'leaflet'

function svgMarker(latlng, svg) {
  return new L.marker(latlng, {icon: svgIcon(svg)});
}

function svgIcon(svg) {
  return new L.divIcon({
    html: svg,
    className: "",
  });
}

// geometry
function dsin(a) {
  return Math.sin(a * Math.PI / 180.0);
}
function dcos(a) {
  return Math.cos(a * Math.PI / 180.0);
}

function ar(a, r) {
  return [r*dsin(a), r*dcos(a)]
}

// create the SVG path commands for an n-gon of radius r
function svgPolygon(n, r, stroke, fill) {
  let strokeFill = `stroke="${stroke ?? "#336799"}" fill="${fill ?? stroke ?? "#336799"}"`;
  let str = `<svg width="${2*r}" height="${2*r}" viewBox="-50 -50 100 100" xmlns="http://www.w3.org/2000/svg">`;
  if (n === Infinity) { // circle
    str += `<circle cx="0" cy="0" r="50" ${strokeFill} />`;
  } else {
    let points = []
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
  str += "</svg>";
  return str;
}

export function PolygonMarker(latlng, n, r, stroke, fill) {
  return new svgMarker(
    latlng,
    svgPolygon(n, r, stroke, fill)
  );
}