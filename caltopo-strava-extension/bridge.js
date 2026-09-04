chrome.runtime.sendMessage({
  type: "caltopo-strava-normalize-cookies"
}).then((result) => {
  if (!result?.ok) {
    console.warn("CalTopo Strava Heatmap: could not update Strava cookies.", result?.error);
  }
}).catch((error) => {
  console.warn("CalTopo Strava Heatmap: could not contact the service worker.", error);
}).finally(() => {
  document.documentElement.dataset.caltopoStravaCookiesReady = "true";
  window.dispatchEvent(new CustomEvent("caltopo-strava-cookies-ready"));
});

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type !== "caltopo-strava-http-error") return;

  window.dispatchEvent(new CustomEvent("caltopo-strava-http-error", {
    detail: { status: message.status }
  }));
});