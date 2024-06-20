export const makiCompatibility = [
  { compatible: "point", maki: "circle", },
  { compatible: "c:ring", maki: "circle-stroked", },
  // TODO c:target1 - makiPaths["circle-stroked"] + "M6.5 7.5A1 1 0 0 0 8.5 7.5A1 1 0 0 0 6.5 7.5"
  // TODO c:target2
  // TODO c:target3 - "M 1 7 A 6 6 0 0 1 7 1 H 8 A 6 6 0 0 1 14 7 V 8 A 6 6 0 0 1 8 14 H 7 A 6 6 0 0 1 1 8 V 7 Z M 7 2 a 5 5 0 0 0 -5 5 h 3 a 2 2 0 0 1 2 -2 z M 2 8 a 5 5 0 0 0 5 5 v -3 a 2 2 0 0 1 -2 -2 z M 8 13 a 5 5 0 0 0 5 -5 h -3 a 2 2 0 0 1 -2 2 z M 13 7 a 5 5 0 0 0 -5 -5 v 3 a 2 2 0 0 1 2 2 z M 7 6 a 1 1 0 0 0 -1 1 h 1 z M 6 8 a 1 1 0 0 0 1 1 v -1 z M 8 9 a 1 1 0 0 0 1 -1 h -1 z M 9 7 a 1 1 0 0 0 -1 -1 v 1 z"
  // TODO a:0 arrow
  // TODO a:1 arrow
  // TODO a:2 arrow - Svg.toString(Svg.translate(Svg.rotate(Svg.parse(makiPaths.arrow), -Math.PI / 2), 0, 15))
  // TODO a:3 arrow
  // TODO a:4 arrow
  // TODO pin
  { compatible: "placemark2", maki: "temaki-pin", },
  // TODO flag-1
  // TODO flag-2
  // TODO any two characters inside a circle: "t:!", "T:00", etc.
  // some characters like ! go in a black circle. Most go in a white circle
  // TODO "circle-a" through "circle-z" and "circle-1" through "circle-10"
  { compatible: "hut", maki: "temaki-hut", },
  { compatible: "lodging", maki: "lodging", },
  { compatible: "leanto", maki: "temaki-sleep_shelter", },
  { compatible: "shelter-empty", maki: "shelter", },
  { compatible: "shelter-picnic", maki: "temaki-picnic_shelter", },
  { compatible: "picnicbench", maki: "picnic-site", },
  { compatible: "camping", maki: "campsite", },
  { compatible: "campfire", maki: "temaki-campfire", },
  { compatible: "flame", maki: "fire-station", },
  { compatible: "photo", maki: "attraction", },
  { compatible: "radiotower", maki: "communications-tower", },
  { compatible: "firelookout", maki: "observation-tower", },
  { compatible: "lighthouse", maki: "lighthouse", },
  { compatible: "anchorage", maki: "harbor", },
  // TODO lifepreserver
  { compatible: "marsh", maki: "wetland", },
  { compatible: "waterfalls", maki: "waterfall", },
  { compatible: "peak", maki: "mountain", },
  { compatible: "drinking-water", maki: "drinking-water", },
  { compatible: "phone", maki: "telephone", },
  { compatible: "shower", maki: "temaki-shower", },
  { compatible: "firstaidplus", maki: "temaki-briefcase_cross", },
  { compatible: "binoc", maki: "temaki-binoculars", },
  { compatible: "fuel", maki: "fuel", },
  { compatible: "info", maki: "information", },
  { compatible: "automobile", maki: "car", },
  // TODO 4wd
  // TODO atv
  { compatible: "snowmobiling", maki: "temaki-snowmobile", },
  // TODO snowmobiling-no
  { compatible: "gate-side", maki: "temaki-gate", },
  // TODO bicycling-uphill
  { compatible: "bicycling", maki: "bicycle", },
  // TODO bicycling-downhill
  // TODO bicycle-no
  // TODO hiking-uphill
  // TODO hiking
  // TODO hiking-downhill
  { compatible: "snowshoeing", maki: "temaki-snow_shoeing", },
  { compatible: "iceskating", maki: "temaki-ice_skating", },
  { compatible: "skiing-xc", maki: "temaki-cross_country_skiing", },
  { compatible: "skiing-downhill", maki: "skiing", },
  { compatible: "snowboarding", maki: "temaki-snowboarding", },
  { compatible: "sledding", maki: "temaki-sledding", },
  { compatible: "chairlift", maki: "temaki-chairlift", },
  // TODO caving
  { compatible: "scrambling", maki: "temaki-climbing", },
  { compatible: "climbing-2", maki: "temaki-abseiling", },
  // TODO climbing-1
  // TODO rappelling
  { compatible: "hanggliding", maki: "temaki-hang_gliding", },
  // TODO paragliding
  { compatible: "canoeing-1", maki: "temaki-canoe", },
  { compatible: "river-rafting", maki: "temaki-rafting", },
  { compatible: "sailing", maki: "temaki-sailing", },
  { compatible: "windsurfing", maki: "temaki-wind_surfing", },
  { compatible: "personal-watercraft", maki: "temaki-jet_skiing", },

  // TODO { label: "snorkeling", pattern: "" },
  { compatible: "swimming", maki: "swimming", },
  { compatible: "surfing", maki: "temaki-surfing", },
  // TODO { label: "tidepool", pattern: "" },
  { compatible: "diving", maki: "temaki-diving", },
  { compatible: "beach", maki: "beach", },
  { compatible: "fishing", maki: "temaki-fishing_pier", },
  // TODO { label: "shooting", pattern: "" },
  // TODO { label: "canoeing-2", pattern: "" },
  { compatible: "kayaking", maki: "temaki-kayaking", },
  { compatible: "boatlaunch", maki: "temaki-boat_ramp", },
  { compatible: "rockfall", maki: "temaki-cliff_falling_rocks", },
  // TODO { label: "slip", pattern: "" },
  // TODO { label: "cliff-edge", pattern: "" },
  { compatible: "danger", maki: "danger", },
  // TODO { label: "aed", pattern: "" },
  { compatible: "atm", maki: "temaki-atm2", },
  { compatible: "busstop", maki: "bus", },
  { compatible: "construction", maki: "construction", },
  { compatible: "dogs-offleash", maki: "dog-park", },
  // TODO { label: "dogs-onleash", pattern: "" },
  // TODO { label: "dogs-no", pattern: "" },
  { compatible: "horses-riding", maki: "horse-riding", },
  // TODO { label: "horses-no", pattern: "" },
  { compatible: "electric-hookup", maki: "temaki-electronic", },
  { compatible: "electric-charging", maki: "charging-station", },
  { compatible: "foodservice", maki: "restaurant", },
  { compatible: "golf", maki: "golf", },
  { compatible: "wheelchair", maki: "wheelchair", },
  { compatible: "low-vision-access", maki: "temaki-blind", },
  // TODO { label: "maps", pattern: "" },
  { compatible: "rangerstation2", maki: "ranger-station", },
  { compatible: "recycling", maki: "recycling", },
  { compatible: "rv-campground", maki: "temaki-camper_trailer", },
  { compatible: "tramway", maki: "aerialway", },
  { compatible: "trashcan", maki: "waste-basket", },
  // TODO { label: "wifi", pattern: "" },
  { compatible: "airport", maki: "airport", },
  { compatible: "wilderness", maki: "temaki-tree_needleleaved", },
]