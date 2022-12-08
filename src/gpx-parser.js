// MIT License

// Copyright (c) 2018 Lucas Trebouet Voisin
// https://github.com/Luuka/GPXParser.js

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

/**
 * GPX file parser
 * 
 * @constructor
 */
 let gpxParser = function () {
  this.xmlSource = "";
  this.metadata  = {};
  this.waypoints = [];
  this.tracks    = [];
  this.routes    = [];
};

/**
* Parse a gpx formatted string to a GPXParser Object.
*
* Format: https://www.topografix.com/GPX/1/1
* 
* @param {string} gpxstring - A GPX formatted String
* 
* @return {gpxParser} A GPXParser object
*/
gpxParser.prototype.parse = function (gpxstring) {
  let keepThis = this;

  let domParser = new window.DOMParser();
  this.xmlSource = domParser.parseFromString(gpxstring, 'text/xml');

  // validate that the document's only child node is a GPX element
  if (this.xmlSource.childNodes.length !== 1) {
    throw Error(`Invalid GPX: document should have exactly one child. Found ${this.xmlSource.childNodes.length}.`);
  }
  const gpxNode = this.xmlSource.childNodes.item(0);
  if (gpxNode.nodeName !== "gpx" || gpxNode.nodeType !== 1) {
    throw Error(`Invalid GPX: outer node should be a <gpx> element. Found ${gpxNode.nodeName} of NodeType ${gpxNode.nodeType}.`)
  }

  // required attributes version and creator
  attachRequired(this, "version", gpxNode.getAttribute("version"));
  attachRequired(this, "creator", gpxNode.getAttribute("creator"));

  attachOptional(this, "metadata", getMetadata(this.xmlSource.querySelector("metadata")));

  keepThis.waypoints = Array.from(this.xmlSource.querySelectorAll('wpt'))
                            .map((wpt) => getPointData(wpt));

  keepThis.routes = Array.from(this.xmlSource.querySelectorAll('rte'))
                         .map((rte) => getRouteData(rte));

  keepThis.tracks = Array.from(this.xmlSource.querySelectorAll('trk'))
                         .map((trk) => getTrackData(trk));
  return this;
};

// https://www.topografix.com/GPX/1/1/#type_emailType
function getEmailData(email) {
  if (email === null || email === undefined) return email;
  let data = {};
  attachRequired(data, "id", email.getAttribute("id"));
  attachRequired(data, "domain", email.getAttribute("domain"));
  return data;
}

// https://www.topografix.com/GPX/1/1/#type_personType
function getPersonData(person) {
  if (person === null || person === undefined) return person;
  let data = {};
  attachOptional(data, "name", getElementValue(person, "name"));
  attachOptional(data, "email", getEmailData(person.querySelector("email")))
  attachOptional(
    data,
    "links",
    Array.from(person.querySelectorAll('link')).map((link) => getLinkData(link))
    );
  return data;
}

// https://www.topografix.com/GPX/1/1/#type_metadataType
function getMetadata(metadata) {
  if (metadata === null || metadata === undefined) return metadata;
  let data = {};
  attachOptional(data, "name", getElementValue(metadata, "name"));
  attachOptional(data, "desc", getElementValue(metadata, "desc"));
  attachOptional(data, "author", getPersonData(metadata.querySelector("author")));
  // TODO copyright
  attachOptional(
    data,
    "links",
    Array.from(queryDirectSelectorAll(metadata, 'link')).map((link) => getLinkData(link))
    );
  attachOptional(data, "time", getDateElementValue(metadata, "time"));
  attachOptional(data, "keywords", getElementValue(metadata, "keywords"));
  // TODO bounds
  // TODO extensions

  return data;
}

// https://www.topografix.com/GPX/1/1/#type_trksegType
function getTrackSegmentData(trkseg) {
  let segment = {};
  segment.points = Array.from(trkseg.querySelectorAll('trkpt'))
                        .map((trkpt) => getPointData(trkpt));
  return segment;
}

// https://www.topografix.com/GPX/1/1/#type_trkType
function getTrackData(trk) {
  let track = {};

  // optional information
  attachOptional(track, "name", getElementValue(trk, "name"));
  attachOptional(track, "cmt", getElementValue(trk, "cmt"));
  attachOptional(track, "desc", getElementValue(trk, "desc"));
  attachOptional(track, "src", getElementValue(trk, "src"));
  attachOptional(
    track,
    "links",
    Array.from(trk.querySelectorAll('link')).map((link) => getLinkData(link))
    );
  attachOptional(track, "number", getIntElementValue(trk, "number"));
  attachOptional(track, "type", getElementValue(trk, "type"));

  // TODO extensions

  track.segments = Array.from(trk.querySelectorAll('trkseg'))
                      .map((trkseg) => getTrackSegmentData(trkseg));

  return track;
}

// https://www.topografix.com/GPX/1/1/#type_rteType
function getRouteData(rte) {
  let route = {};

  // optional information
  attachOptional(route, "name", getElementValue(rte, "name"));
  attachOptional(route, "cmt", getElementValue(rte, "cmt"));
  attachOptional(route, "desc", getElementValue(rte, "desc"));
  attachOptional(route, "src", getElementValue(rte, "src"));
  attachOptional(
    route,
    "links",
    Array.from(rte.querySelectorAll('link')).map((link) => getLinkData(link))
    );
  attachOptional(route, "number", getIntElementValue(rte, "number"));
  attachOptional(route, "type", getElementValue(rte, "type"));

  // TODO extensions

  route.points = Array.from(rte.querySelectorAll('rtept'))
                      .map((rtept) => getPointData(rtept));

  return route;
}

// https://www.topografix.com/GPX/1/1/#type_linkType
function getLinkData(linkNode) {
  let link = {};
  attachRequired(link, "href", linkNode.getAttribute("href"));
  attachOptional(link, "text", getElementValue(linkNode, "text"));
  attachOptional(link, "type", getElementValue(linkNode, "type"));
  return link;
}

// https://www.topografix.com/GPX/1/1/#type_wptType
function getPointData(wpt) {
  let pt  = {};

  // Required information
  attachRequired(pt, "lat", getFloatAttribute(wpt, "lat"));
  attachRequired(pt, "lon", getFloatAttribute(wpt, "lon"));

  // Optional position information
  attachOptional(pt, "ele", getFloatElementValue(wpt, "ele"));
  attachOptional(pt, "time", getDateElementValue(wpt, "time"));
  attachOptional(pt, "magvar", getFloatElementValue(wpt, "magvar"));
  attachOptional(pt, "geoidheight", getFloatElementValue(wpt, "geoidheight"));

  // Optional description information
  attachOptional(pt, "name", getElementValue(wpt, "name"));
  attachOptional(pt, "cmt", getElementValue(wpt, "cmt"));
  attachOptional(pt, "desc", getElementValue(wpt, "desc"));
  attachOptional(pt, "src", getElementValue(wpt, "src"));
  attachOptional(
    pt,
    "links",
    Array.from(wpt.querySelectorAll('link')).map((link) => getLinkData(link))
    );
  attachOptional(pt, "sym", getElementValue(wpt, "sym"));
  attachOptional(pt, "type", getElementValue(wpt, "type"));

  // Optional accuracy information
  attachOptional(pt, "fix", getElementValue(wpt, "fix"));
  attachOptional(pt, "sat", getIntElementValue(wpt, "sat"));
  attachOptional(pt, "hdop", getFloatElementValue(wpt, "hdop"));
  attachOptional(pt, "vdop", getFloatElementValue(wpt, "vdop"));
  attachOptional(pt, "pdop", getFloatElementValue(wpt, "pdop"));
  attachOptional(pt, "ageofdgpsdata", getFloatElementValue(wpt, "ageofdgpsdata"));
  attachOptional(pt, "dgpsid", getFloatElementValue(wpt, "dgpsid"));

  // TODO extensions

  return pt;
}

/**
* Get value from a XML DOM element
* 
* @param  {Element} parent - Parent DOM Element
* @param  {string} needle - Name of the searched element
* 
* @return {} The element value
*/
function getElementValue(parent, needle){
  let elem = parent.querySelector(needle);
  if(elem != null){
      return elem.innerHTML ?? elem.childNodes[0].data;
  }
  return elem;
};

function getTransformedElementValue(root, name, transform) {
  const raw = getElementValue(root, name);
  if (raw === null || raw === undefined) {
    return raw;
  }
  return transform ? transform(raw) :raw;
}

function getIntElementValue(root, name) {
  return getTransformedElementValue(root, name, (v) => parseInt(v));
}

function getFloatElementValue(root, name) {
  return getTransformedElementValue(root, name, (v) => parseFloat(v));
}

function getDateElementValue(root, name) {
  return getTransformedElementValue(root, name, (v) => new Date(v));
}

function getTransformedAttribute(root, name, transform) {
  const raw = root.getAttribute(name);
  if (raw === null || raw === undefined) {
    return raw;
  }
  return transform ? transform(raw) :raw;
}

function getIntAttribute(root, name) {
  return getTransformedAttribute(root, name, (v) => parseInt(v));
}

function getFloatAttribute(root, name) {
  return getTransformedAttribute(root, name, (v) => parseFloat(v));
}

function getDateAttribute(root, name) {
  return getTransformedAttribute(root, name, (v) => new Date(v));
}

function attachRequired(obj, name, val) {
  if (val === null || val === undefined) {
    throw Error(`Required attribute '${name}' not found.`)
  }
  obj[name] = val;
}

function attachOptional(obj, name, val) {
  if (val !== null && val !== undefined && val.length !== 0) {
    obj[name] = val;
  }
}


/**
* Search the value of a direct child XML DOM element
* 
* @param  {Element} parent - Parent DOM Element
* @param  {string} needle - Name of the searched element
* 
* @return {} The element value
*/
function queryDirectSelector(parent, needle) {

  let elements  = parent.querySelectorAll(needle);
  let finalElem = elements[0];

  if(elements.length > 1) {
      let directChilds = parent.childNodes;

      for(const idx in directChilds) {
          const elem = directChilds[idx];
          if(elem.tagName === needle) {
              finalElem = elem;
          }
      }
  }

  return finalElem;
};

function queryDirectSelectorAll(parent, needle) {
  return Array.from(parent.childNodes).filter((elem) =>
    elem.tagName === needle
  );
};

gpxParser.prototype.calculate = function() {
  for (const track of this.tracks) {
    for (const segment of track.segments) {
      calculatePointContainer(segment);
    }
    attachOptional(track, "startTime", track.segments?.[0]?.startTime);
    attachOptional(track, "duration", track.segments?.reduce((d,s) => d+s.duration, 0)); // TODO can be undefined if s.duration is
    attachOptional(track, "distance", track.segments?.reduce((d,s) => d+s.distance, 0));
    attachOptional(track, "cumulativeDistance", track.segments?.map((s) => s.distance));
    attachOptional(track, "minElevation", track.segments?.reduce((e,s) => Math.min(s.minElevation, e), track.segments[0].minElevation));
    attachOptional(track, "maxElevation", track.segments?.reduce((e,s) => Math.max(s.maxElevation, e), track.segments[0].maxElevation));
    attachOptional(track, "gain", track.segments?.reduce((d,s) => d+s.gain, 0));
    attachOptional(track, "loss", track.segments?.reduce((d,s) => d+s.loss, 0));
  }
  for (const route of this.routes) {
    calculatePointContainer(route);
  }
  return this;
}

function calculatePointContainer(container) {
  const points = container.points;
  if (points.length > 0) {
    // calculate startTime and duration from .time
    if (points[0].time) {
      // set startTime
      container.startTime = points[0].time;
      if (points[points.length - 1].time) {
        // set duration
        container.duration = points[points.length - 1].time - points[0].time;
      }
    }
    // Calculate distance from position
    let totalDist = 0;
    const cumulativeDist = [0];
    for (let i = 1; i < points.length; i++) {
      // TODO bearing at each point?
      totalDist += calcDistanceBetween(points[i-1], points[i]);
      cumulativeDist.push(totalDist);
    }
    // set distance, cumulativeDist
    container.distance = totalDist;
    container.cumulativeDist = cumulativeDist;
    // Calculate gain, loss, min elev, max elev
    if (points[0]?.ele) {
      let minElev = points[0].ele;
      let maxElev = minElev;
      let gain = 0;
      let loss = 0;
      // TODO cumulative gain, loss?
      for (let i = 1; i < points.length; i++) {
        const currElev = points[i].ele;
        if (currElev > maxElev) maxElev = currElev;
        if (currElev < minElev) minElev = currElev;
        const diff = currElev - points[i-1].ele;
        if (diff < 0) {
          loss -= diff;
        } else {
          gain += diff;
        }
      }
      container.minElevation = minElev;
      container.maxElevation = maxElev;
      container.gain = gain;
      container.loss = loss;
    }
  }
  return container;
}

/**
* Calcul Distance between two points with lat and lon
* 
* @param  {} wpt1 - A geographic point with lat and lon properties
* @param  {} wpt2 - A geographic point with lat and lon properties
* 
* @returns {float} The distance between the two points
*/
function calcDistanceBetween(wpt1, wpt2) {
  let latlng1 = {};
  latlng1.lat = wpt1.lat;
  latlng1.lon = wpt1.lon;
  let latlng2 = {};
  latlng2.lat = wpt2.lat;
  latlng2.lon = wpt2.lon;
  var rad = Math.PI / 180,
      lat1 = latlng1.lat * rad,
      lat2 = latlng2.lat * rad,
      sinDLat = Math.sin((latlng2.lat - latlng1.lat) * rad / 2),
      sinDLon = Math.sin((latlng2.lon - latlng1.lon) * rad / 2),
      a = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon,
      c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return 6371000 * c;
};

// functions below are for converting from processed GPX to GeoJSON
function pointToGeoJSONCoordinate(pt) {
  let coord = [];
  coord.push(pt.lon);
  coord.push(pt.lat);
  if (pt.ele !== null && pt.ele !== undefined) {
    coord.push(pt.ele);
  }
  if (pt.time !== null && pt.time !== undefined) {
    coord.push(pt.time);
  }
  return coord;
}

function segmentToGeoJSONCoordinates(segment) {
  return segment.points.map(pointToGeoJSONCoordinate);
}

function trackToGeoJSONMultiLineString(track) {
  const { ["segments"]: segments, ...properties } = track;
  return {
    "type": "Feature",
    "geometry": {
      "type": "MultiLineString",
      "coordinates": segments.map(segmentToGeoJSONCoordinates)
    },
    "properties": properties
  };
}

function routeToGeoJSONLineString(route) {
  const { ["points"]: points, ...properties } = route;
  return {
    "type": "Feature",
    "geometry": {
      "type": "LineString",
      "coordinates": points.map(pointToGeoJSONCoordinate)
    },
    "properties": properties
  };
}

function waypointToGeoJSONPoint(pt) {
  const { ["lat"]: lat, ["lon"]: lon, ...properties } = pt;
  return {
    "type": "Feature",
    "geometry": {
      "type": "Point",
      "coordinates": pointToGeoJSONCoordinate(pt)
    },
    "properties": properties
  };
}

/**
* Export the GPX object to a GeoJSON formatted Object
* 
* @returns {} a GeoJSON formatted Object
*/
gpxParser.prototype.toGeoJSON = function () {
  var GeoJSON = {
      "type": "FeatureCollection",
      "features": [],
      "properties": this.metadata,
  };

  GeoJSON.features = GeoJSON.features.concat(this.tracks.map(trackToGeoJSONMultiLineString));
  GeoJSON.features = GeoJSON.features.concat(this.routes.map(routeToGeoJSONLineString));
  GeoJSON.features = GeoJSON.features.concat(this.waypoints.map(waypointToGeoJSONPoint));

  return GeoJSON;
};

export default gpxParser;