(() => {
  const OVERLAY_KEY = "__caltopoStravaOverlay";
  const RIBBON_ID = "caltopo-strava-ribbon";
  const RETRY_INTERVAL_MS = 500;
  const MAX_ATTEMPTS = 120;
  const ACTIVITIES = [
    ["all", "All activities"],
    ["run", "All foot activities"],
    ["sport_Run", "Run"],
    ["sport_TrailRun", "Trail Run"],
    ["sport_Walk", "Walk"],
    ["sport_Hike", "Hike"],
    ["ride", "All cycling activities"],
    ["sport_Ride", "Ride"],
    ["sport_MountainBikeRide", "Mountain Bike Ride"],
    ["sport_GravelRide", "Gravel Ride"],
    ["sport_EBikeRide", "E-Bike Ride"],
    ["sport_EMountainBikeRide", "E-Mountain Bike Ride"],
    ["sport_Velomobile", "Velomobile"],
    ["water", "All water activities"],
    ["sport_Canoeing", "Canoeing"],
    ["sport_Kayaking", "Kayaking"],
    ["sport_Kitesurf", "Kitesurf"],
    ["sport_Rowing", "Rowing"],
    ["sport_Sail", "Sail"],
    ["sport_StandUpPaddling", "Stand Up Paddling"],
    ["sport_Surfing", "Surfing"],
    ["sport_Swim", "Swim"],
    ["sport_Windsurf", "Windsurf"],
    ["winter", "All winter activities"],
    ["sport_AlpineSki", "Alpine Ski"],
    ["sport_BackcountrySki", "Backcountry Ski"],
    ["sport_IceSkate", "Ice Skate"],
    ["sport_NordicSki", "Nordic Ski"],
    ["sport_Snowboard", "Snowboard"],
    ["sport_Snowshoe", "Snowshoe"],
    ["sport_Badminton", "Badminton"],
    ["sport_Golf", "Golf"],
    ["sport_Handcycle", "Handcycle"],
    ["sport_InlineSkate", "Inline Skate"],
    ["sport_Pickleball", "Pickleball"],
    ["sport_RockClimbing", "Rock Climbing"],
    ["sport_RollerSki", "Roller Ski"],
    ["sport_Skateboard", "Skateboard"],
    ["sport_Soccer", "Soccer"],
    ["sport_Tennis", "Tennis"],
    ["sport_Wheelchair", "Wheelchair"]
  ];
  const COLORS = ["mobileblue", "gray", "bluered", "hot", "purple", "orange"];
  let enabled = true;
  let opacity = 1;
  let activity = "run";
  let color = "orange";
  let enabledInput;
  let activityInput;
  let colorInput;
  let opacityInput;
  let opacityOutput;

  function getGoogleMap() {
    const googleMap = window.map?.map?.map;
    return window.google?.maps && googleMap?.overlayMapTypes
      ? googleMap
      : null;
  }

  function detachOverlay() {
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

  function removeOverlay() {
    enabled = false;
    updateControls();
    return detachOverlay();
  }

  function addOverlay() {
    enabled = true;
    updateControls();
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

        return `https://content-a.strava.com/identified/globalheat/${activity}/${color}/${zoom}/${x}/${y}.png?v=19`;
      },
      tileSize: new window.google.maps.Size(512, 512),
      minZoom: 13,
      maxZoom: 16,
      name: "Strava Foot Orange",
      opacity
    });

    googleMap.overlayMapTypes.push(overlay);
    window[OVERLAY_KEY] = overlay;
    return true;
  }

  function setOpacity(value) {
    opacity = Math.max(0, Math.min(1, Number(value)));
    window[OVERLAY_KEY]?.setOpacity(opacity);
    updateControls();
    return opacity;
  }

  function setActivity(value) {
    if (!ACTIVITIES.some(([optionValue]) => optionValue === value)) return activity;
    activity = value;
    refreshOverlay();
    return activity;
  }

  function setColor(value) {
    if (!COLORS.includes(value)) return color;
    color = value;
    refreshOverlay();
    return color;
  }

  function refreshOverlay() {
    updateControls();
    if (!enabled) return;
    detachOverlay();
    addOverlay();
  }

  function updateControls() {
    if (enabledInput) enabledInput.checked = enabled;
    if (activityInput) activityInput.value = activity;
    if (colorInput) colorInput.value = color;
    if (opacityInput) {
      opacityInput.value = String(Math.round(opacity * 100));
      opacityInput.disabled = !enabled;
    }
    if (opacityOutput) opacityOutput.value = `${Math.round(opacity * 100)}%`;
  }

  function createRibbon() {
    if (document.getElementById(RIBBON_ID)) return;

    const ribbon = document.createElement("div");
    ribbon.id = RIBBON_ID;
    ribbon.setAttribute("role", "toolbar");
    ribbon.setAttribute("aria-label", "Strava heatmap controls");
    Object.assign(ribbon.style, {
      position: "fixed",
      top: "0",
      left: "0",
      right: "0",
      zIndex: "2147483647",
      display: "flex",
      flexWrap: "wrap",
      alignItems: "center",
      justifyContent: "center",
      gap: "12px",
      minHeight: "38px",
      boxSizing: "border-box",
      padding: "6px 14px",
      color: "#ffffff",
      background: "#d84828",
      borderBottom: "1px solid #a62e19",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.25)",
      font: "600 13px/1.2 sans-serif"
    });

    const toggleLabel = document.createElement("label");
    Object.assign(toggleLabel.style, {
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      cursor: "pointer"
    });

    enabledInput = document.createElement("input");
    enabledInput.type = "checkbox";
    enabledInput.setAttribute("aria-label", "Show Strava heatmap");
    enabledInput.addEventListener("change", () => {
      if (enabledInput.checked) addOverlay();
      else removeOverlay();
    });

    const title = document.createElement("span");
    title.textContent = "Strava heatmap";
    toggleLabel.append(enabledInput, title);

    const createSelect = (labelText, options, onChange) => {
      const label = document.createElement("label");
      label.textContent = labelText;
      Object.assign(label.style, {
        display: "inline-flex",
        alignItems: "center",
        gap: "6px"
      });

      const select = document.createElement("select");
      select.setAttribute("aria-label", `Strava heatmap ${labelText.toLowerCase()}`);
      Object.assign(select.style, {
        maxWidth: "190px",
        height: "26px",
        border: "1px solid #a62e19",
        borderRadius: "4px",
        background: "#ffffff",
        color: "#262626"
      });
      for (const [value, text] of options) {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = text;
        select.appendChild(option);
      }
      select.addEventListener("change", () => onChange(select.value));
      label.appendChild(select);
      return { label, select };
    };

    const activityControl = createSelect("Activity", ACTIVITIES, setActivity);
    activityInput = activityControl.select;
    const colorControl = createSelect(
      "Color",
      COLORS.map((value) => [value, value]),
      setColor
    );
    colorInput = colorControl.select;

    const opacityLabel = document.createElement("label");
    opacityLabel.textContent = "Opacity";
    Object.assign(opacityLabel.style, {
      display: "inline-flex",
      alignItems: "center",
      gap: "7px"
    });

    opacityInput = document.createElement("input");
    opacityInput.type = "range";
    opacityInput.min = "0";
    opacityInput.max = "100";
    opacityInput.step = "1";
    opacityInput.setAttribute("aria-label", "Strava heatmap opacity");
    Object.assign(opacityInput.style, {
      width: "clamp(100px, 20vw, 220px)",
      accentColor: "#ffffff"
    });
    opacityInput.addEventListener("input", () => {
      setOpacity(Number(opacityInput.value) / 100);
    });

    opacityOutput = document.createElement("output");
    opacityOutput.setAttribute("aria-live", "polite");
    Object.assign(opacityOutput.style, {
      width: "36px",
      fontVariantNumeric: "tabular-nums"
    });
    opacityLabel.append(opacityInput, opacityOutput);
    ribbon.append(
      toggleLabel,
      activityControl.label,
      colorControl.label,
      opacityLabel
    );
    document.body.appendChild(ribbon);
    updateControls();
  }

  createRibbon();
  window.caltopoStrava = {
    add: addOverlay,
    remove: removeOverlay,
    setOpacity,
    setActivity,
    setColor
  };

  let attempts = 0;
  const timer = window.setInterval(() => {
    attempts += 1;
    if (!enabled || addOverlay() || attempts >= MAX_ATTEMPTS) {
      window.clearInterval(timer);
      if (attempts >= MAX_ATTEMPTS && !window[OVERLAY_KEY]) {
        console.warn("CalTopo Strava Heatmap: map was not found.");
      }
    }
  }, RETRY_INTERVAL_MS);
})();