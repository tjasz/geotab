# CalTopo Strava Heatmap extension

This unpacked Chrome/Edge extension adds the Strava running heatmap to CalTopo's Google map after the map finishes loading.

## Install in Chrome

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked** and select this directory.
4. Reload an open `https://caltopo.com/` map page.

For Edge, use `edge://extensions` and the same **Load unpacked** flow.

The Strava `/identified/` endpoint still requires valid Strava CloudFront cookies. The extension does not obtain or modify authentication cookies.

## Console controls

```js
caltopoStrava.remove()
caltopoStrava.add()
```

After editing the extension, click its reload button on the extensions page and reload CalTopo.