const STRAVA_COOKIE_NAMES = [
  "_strava_idcf",
  "CloudFront-Key-Pair-Id",
  "CloudFront-Policy",
  "CloudFront-Signature"
];

async function getCookieStoreId(tabId) {
  if (tabId == null) return undefined;
  const stores = await chrome.cookies.getAllCookieStores();
  return stores.find((store) => store.tabIds.includes(tabId))?.id;
}

async function normalizeStravaCookies(tabId) {
  const storeId = await getCookieStoreId(tabId);
  const changed = [];

  for (const name of STRAVA_COOKIE_NAMES) {
    const cookies = await chrome.cookies.getAll({
      name,
      ...(storeId ? { storeId } : {})
    });

    for (const cookie of cookies) {
      const domain = cookie.domain.replace(/^\./, "");
      if (domain !== "strava.com" && !domain.endsWith(".strava.com")) continue;
      if (cookie.sameSite === "no_restriction" && cookie.secure) continue;

      const details = {
        url: `https://${domain}${cookie.path}`,
        name: cookie.name,
        value: cookie.value,
        path: cookie.path,
        secure: true,
        httpOnly: cookie.httpOnly,
        sameSite: "no_restriction",
        storeId: cookie.storeId
      };

      if (!cookie.hostOnly) details.domain = cookie.domain;
      if (cookie.expirationDate != null) {
        details.expirationDate = cookie.expirationDate;
      }
      if (cookie.partitionKey) details.partitionKey = cookie.partitionKey;

      const updatedCookie = await chrome.cookies.set(details);
      if (updatedCookie) changed.push(updatedCookie.name);
    }
  }

  return changed;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== "caltopo-strava-normalize-cookies") return;

  normalizeStravaCookies(sender.tab?.id)
    .then((changed) => sendResponse({ ok: true, changed }))
    .catch((error) => sendResponse({ ok: false, error: error.message }));
  return true;
});

chrome.webRequest.onCompleted.addListener(
  (details) => {
    if (details.statusCode !== 403 || details.tabId < 0) return;

    chrome.tabs.sendMessage(details.tabId, {
      type: "caltopo-strava-http-error",
      status: details.statusCode
    }).catch(() => {});
  },
  {
    urls: ["https://content-a.strava.com/identified/globalheat/*"],
    types: ["image"]
  }
);