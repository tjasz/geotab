# Geotab

Geotab is designed for viewing, editing, and interacting with geographical/tabular data.
It fills two key niches that are unsatisfied by existing solutions.

1. In geotab, users can filter data rows by their properties
   and determine how they are displayed based on those properties.
   This is available in desktop GIS applications, but not in many browser interfaces.
2. Unlike in desktop GIS applications such as ArcGIS,
   the symbology of a data set can be based on multiple properties.
   For example, with a data set of mountain peaks, the size of the marker can be based on
   the peak's elevation, and its color based on the peak's prominence.

## Visited areas

When no detail feature is selected, open the bottom **Visited Areas** panel and
click **Analyse**. A progress indicator tracks analysis of all loaded features.
Lines and polygon rings are simplified on a copy using Douglas-Peucker with a
30-meter tolerance, then sampled inside every zoom-17 tile crossed by each
segment in Web Mercator space. This preserves continuous coverage even for
straight tracks, tiny corner crossings, and tracks near 85 degrees latitude.
Point and multipoint locations are retained without connecting them.

After analysis, select an **Area zoom** from 1 through 17. Each level quarters
the grid, and the summary below the dropdown shows the visited tile count,
the total `4**z` tiles, and the percentage visited at the selected zoom.
After collecting tiles, analysis uses breadth-first search at each zoom to find
clusters connected horizontally or vertically (not diagonally). The panel lists
the five largest clusters at the selected zoom, ranked by tile count.
Click a cluster's tile count to fit the map to the full extent of that cluster.
Analysis also finds up to five fully visited, non-overlapping tile squares at
each zoom. Only squares of at least 2 x 2 tiles qualify; 1 x 1 squares are
excluded from the rankings, links, and outlines.
Squares are selected largest-first, excluding the tiles in each
selected square before finding the next. Equal-size ties are resolved by
westernmost, then northernmost position. The panel shows dimensions and tile
counts (for example, `6 x 6 (36 tiles)`); click an entry to fit the map to it.
The panel also ranks up to five fully visited, non-overlapping **rectangles**
at each zoom by tile area, using the same largest-first exclusion rule.
Rectangles may be squares or one-tile-wide strips, but 1 x 1 tiles are excluded.
Dimensions are shown as width x height with a tile count, and each entry links
to its full map bounds. Equal-area ties prefer westernmost, then northernmost
position, then greater width.
Analysis also finds **yards**: four-connected groups of visited interior tiles
whose four side-sharing neighbors are all visited. This removes one boundary
layer before clustering; diagonal neighbors need not be visited. Buffer tiles
are excluded from the yard's count and bounds. For example, a fully visited
6 x 6 block has a 4 x 4 yard of 16 tiles. The panel links to the five largest
yards at the selected zoom. Thin paths and tiles on the world boundary cannot
form a yard without all four neighbors.
The progress indicator remains visible through clustering, square, yard, and rectangle analysis.
The tiles use the standard Web Mercator XYZ grid, spanning -180 to 180 longitude
and approximately -85.051129 to 85.051129 latitude (X increases eastward,
Y southward). Latitude boundaries follow the Mercator projection, not equal
latitude steps. Coordinates closer to the poles are clamped to this latitude range.
Tiles containing simplified vertices or the added segment samples are visited;
polygon interiors are not filled. Unvisited tiles are shaded `#00000080`.
The overlay draws solid black (`#000000ff`) 1px tile borders. The five largest
rectangles have blue (`#000040ff`) 3px dashed (`6 6`) outlines; the five largest
squares have red (`#400000ff`) outlines with the same width and dash pattern.
The five largest yards have green (`#004000ff`) 3px dotted (`3 3`) outlines
following their actual tile edges, including holes and concavities.
Squares and yards are drawn above rectangles where boundaries overlap.
All borders leave map interactions unobstructed.
Use **Show map overlay** in the panel to hide or restore the shading, grid,
and outlines without clearing the results. The switch is on by default and
its setting persists when changing analysis zoom or inspecting a feature;
cluster, square, rectangle, and yard links still navigate the map while the overlay is hidden.
Results and the selected zoom remain in the data context while inspecting
features; changing the loaded data clears the analysis. Filtering does not
change the analysis scope.

## Inspiration

Although geotab fulfills unique needs that are not met by existing solutions,
inspiration can be drawn from many.

- [GeoCSV](https://tjasz.github.io/geocsv), the precursor to geotab
- [Caltopo](https://caltopo.com/map.html)
- [geojson.io](https://geojson.io/)
- [gpx.studio](https://gpx.studio/)
- [GPX Simplify Optimizer](https://opengeo.tech/maps/gpx-simplify-optimizer/)
- [GeoJSON Dashboard](https://github.com/fulcrumapp/geojson-dashboard)
- Microsoft Excel
- Google Sheets
- Microsoft Dataverse

# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

### `npm run deploy`

Deploy the current folder state to [GitHub Pages](https://tjasz.github.io/geotab).

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
