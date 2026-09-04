# CalTopo Strava Heatmap extension

This unpacked Chrome/Edge extension adds the Strava heatmap to CalTopo's Google map after the map finishes loading. A ribbon at the top of the page can show or hide the layer, choose an activity and color, and adjust its opacity.

## Install in Chrome

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked** and select this directory.
4. Reload an open `https://caltopo.com/` map page.

For Edge, use `edge://extensions` and the same **Load unpacked** flow.

The Strava `/identified/` endpoint requires valid Strava CloudFront cookies. Before loading tiles, the extension changes `_strava_idcf`, `CloudFront-Key-Pair-Id`, `CloudFront-Policy`, and `CloudFront-Signature` cookies on Strava domains to `SameSite=None; Secure`. It preserves their values and other attributes. If Strava still responds to a heatmap tile request with HTTP 403, the extension displays a warning with a link to sign in to Strava.

## Console controls

```js
caltopoStrava.remove()
caltopoStrava.add()
caltopoStrava.setOpacity(0.5)
caltopoStrava.setActivity("sport_Hike")
caltopoStrava.setColor("purple")
```

After editing the extension, click its reload button on the extensions page and reload CalTopo.