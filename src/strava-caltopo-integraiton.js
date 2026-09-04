// Note: to use strava layer, set SameSite=None on the following strava cookies:
// _strava_idcf, CloudFront-Key-Pair-Id, CloudFront-Policy, CloudFront-Signature

// For CalTopo: paste the following into the console:
 
  window.stravaOverlay = new google.maps.ImageMapType({
  getTileUrl(coord, googleZoom) {
    const z = googleZoom - 1;
    if (z < 0) return null;

    const tileCount = 2 ** z;
    const x = ((coord.x % tileCount) + tileCount) % tileCount;
    const y = coord.y;

    if (y < 0 || y >= tileCount) return null;

    const url =
      `https://content-a.strava.com/identified/globalheat/run/orange/` +
      `${z}/${x}/${y}.png?v=19`;

    console.log({ googleZoom, z, x, y, url });
    return url;
  },

  tileSize: new google.maps.Size(512, 512),
  minZoom: 13,
  maxZoom: 16,
  name: "Strava Foot Orange",
  opacity: 1
});

map.map.map.overlayMapTypes.push(window.stravaOverlay);