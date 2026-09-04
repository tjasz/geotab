(() => {
  const OVERLAY_KEY = "__caltopoStravaOverlay";
  const RETRY_INTERVAL_MS = 500;
  const MAX_ATTEMPTS = 120;

  function getGoogleMap() {
    const googleMap = window.map?.map?.map;
    return window.google?.maps && googleMap?.overlayMapTypes
      ? googleMap
      : null;
  }

  function removeOverlay() {
    const overlay = window[OVERLAY_KEY];
    const googleMap = getGoogleMap();
    if (!overlay || !googleMap) return false;

    const overlays = googleMap.overlayMapTypes;
    for (let index = overlays.getLength() - 1; index >= 0; index--) {
      if (overlays.getAt(index) === overlay) overlays.removeAt(index);
    }

    delete window[OVERLAY_KEY];
    return true;
  }

  function addOverlay() {
    const googleMap = getGoogleMap();
    if (!googleMap) return false;
    if (window[OVERLAY_KEY]) return true;

    const overlay = new window.google.maps.ImageMapType({
      getTileUrl(coord, googleZoom) {
        const zoom = googleZoom - 1;
        if (zoom < 0) return null;

        const tileCount = 2 ** zoom;
        const x = ((coord.x % tileCount) + tileCount) % tileCount;
        const y = coord.y;
        if (y < 0 || y >= tileCount) return null;

        return `https://content-a.strava.com/identified/globalheat/run/orange/${zoom}/${x}/${y}.png?v=19`;
      },
      tileSize: new window.google.maps.Size(512, 512),
      minZoom: 13,
      maxZoom: 16,
      name: "Strava Foot Orange",
      opacity: 1
    });

    googleMap.overlayMapTypes.push(overlay);
    window[OVERLAY_KEY] = overlay;
    return true;
  }

  window.caltopoStrava = { add: addOverlay, remove: removeOverlay };

  let attempts = 0;
  const timer = window.setInterval(() => {
    attempts += 1;
    if (addOverlay() || attempts >= MAX_ATTEMPTS) {
      window.clearInterval(timer);
      if (attempts >= MAX_ATTEMPTS && !window[OVERLAY_KEY]) {
        console.warn("CalTopo Strava Heatmap: map was not found.");
      }
    }
  }, RETRY_INTERVAL_MS);
})();