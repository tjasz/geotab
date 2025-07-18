import { Feature } from "@turf/turf";
import L, { LatLng, Marker, Polyline } from "leaflet";


// Custom editor for handling Mapbox routes
export default class MapboxRouteEditor {
  map: any;
  feature: Feature | null;
  polyline: Polyline | null;
  waypoints: LatLng[];
  isDrawing: boolean;
  markers: Marker[];
  routeDistance: number;
  routeCoordinates: any;

  constructor(map, feature = null) {
    this.map = map;
    this.feature = feature;
    this.polyline = null;
    this.waypoints = [];
    this.isDrawing = false;
    this.routeDistance = 0;

    // Initialize edit markers
    this.markers = [];

    // Bind methods
    this.enable = this.enable.bind(this);
    this.disable = this.disable.bind(this);
    this.drawing = this.drawing.bind(this);
    this.startDrawing = this.startDrawing.bind(this);
    this.addWaypoint = this.addWaypoint.bind(this);
    this.fetchRoute = this.fetchRoute.bind(this);
    this.updateRoute = this.updateRoute.bind(this);
    this.handleMarkerDrag = this.handleMarkerDrag.bind(this);
  }

  enable() {
    this.isDrawing = true;
    if (this.feature) {
      // If editing an existing feature, load its points
      if (this.feature.geometry && this.feature.geometry.type === "LineString") {
        this.waypoints = this.feature.geometry.coordinates.map(coord =>
          L.latLng(coord[1], coord[0])
        );

        // Create the polyline
        this.polyline = L.polyline(this.waypoints, {
          color: 'blue',
          weight: 4,
          opacity: 0.7
        }).addTo(this.map);

        // Add markers for each waypoint
        this.waypoints.forEach(waypoint => this.addMarkerAtLatLng(waypoint));
      }
    } else {
      // Set up for new route drawing
      this.waypoints = [];
      this.polyline = L.polyline([], {
        color: 'blue',
        weight: 4,
        opacity: 0.7
      }).addTo(this.map);

      // Set up click handler for adding waypoints
      this.map.on('click', this.addWaypoint);

      // Add hand cursor for drawing mode
      this.map._container.style.cursor = 'crosshair';
    }

    return this;
  }

  disable() {
    this.isDrawing = false;

    // Remove click handler
    this.map.off('click', this.addWaypoint);

    // Restore cursor
    this.map._container.style.cursor = '';

    // Clean up if we're canceling without saving
    if (!this.feature) {
      if (this.polyline) {
        this.map.removeLayer(this.polyline);
      }

      // Remove all markers
      this.markers.forEach(marker => {
        this.map.removeLayer(marker);
      });
    }

    return this;
  }

  drawing() {
    return this.isDrawing;
  }

  startDrawing(latlng) {
    if (latlng) {
      this.addWaypoint({ latlng });
    }
    return this.enable();
  }

  addWaypoint(e) {
    const latlng = e.latlng;

    // Add to waypoints
    this.waypoints.push(latlng);

    // Add a marker at this point
    this.addMarkerAtLatLng(latlng);

    // If we have at least 2 points, fetch the route
    if (this.waypoints.length >= 2) {
      this.fetchRoute();
    } else {
      // Just update the polyline for the first point
      this.polyline?.setLatLngs(this.waypoints);
    }
  }

  addMarkerAtLatLng(latlng) {
    const marker = L.marker(latlng, {
      draggable: true,
      icon: L.divIcon({
        className: 'route-waypoint-marker',
        html: '<div style="width: 10px; height: 10px; background-color: blue; border-radius: 50%; border: 2px solid white;"></div>',
        iconSize: [14, 14],
        iconAnchor: [7, 7]
      })
    }).addTo(this.map);

    // Store reference to this editor in the marker
    // @ts-ignore 2339
    marker.editor = this;

    // Store marker index to know which waypoint it corresponds to
    // @ts-ignore 2339
    marker.waypointIndex = this.markers.length;

    // Add drag handlers
    marker.on('drag', this.handleMarkerDrag);
    marker.on('dragend', () => {
      // Update the waypoint position
      // @ts-ignore 2339
      this.waypoints[marker.waypointIndex] = marker.getLatLng();
      this.fetchRoute();
    });

    this.markers.push(marker);
    return marker;
  }

  handleMarkerDrag(e) {
    const marker = e.target;

    // Update the waypoint in real-time
    this.waypoints[marker.waypointIndex] = marker.getLatLng();

    // If we have only one point, just update the line
    if (this.waypoints.length === 1) {
      this.polyline?.setLatLngs(this.waypoints);
    }

    // Don't fetch during drag to avoid too many API calls
    // We'll fetch on dragend instead
  }

  async fetchRoute() {
    if (this.waypoints.length < 2) return;

    // Show loading indicator or some visual feedback
    this.polyline?.setStyle({
      color: 'gray',
      dashArray: '5, 5',
      opacity: 0.5
    });

    try {
      // Construct coordinates string for the Mapbox API
      const coordinates = this.waypoints.map(latlng =>
        `${latlng.lng},${latlng.lat}`
      ).join(';');

      // Get Mapbox API key - should be stored in environment variable
      const apiKey = process.env.REACT_APP_MAPBOX_API_KEY;
      if (!apiKey) {
        console.error('Mapbox API key not found');
        return;
      }

      // Make the API request
      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/walking/${coordinates}?geometries=geojson&overview=full&annotations=distance&access_token=${apiKey}`
      );

      if (!response.ok) {
        throw new Error(`Mapbox API error: ${response.statusText}`);
      }

      const data = await response.json();

      // Check if we got a valid route
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];

        // Update the polyline with the route geometry
        this.updateRoute(route);
      } else {
        console.error('No route found:', data);

        // Reset the polyline to just connect the waypoints directly
        this.polyline?.setLatLngs(this.waypoints);
        this.polyline?.setStyle({
          color: 'red',
          dashArray: undefined,
          opacity: 0.7
        });
      }
    } catch (error) {
      console.error('Error fetching route:', error);

      // Reset the polyline in case of error
      this.polyline?.setLatLngs(this.waypoints);
      this.polyline?.setStyle({
        color: 'red',
        dashArray: undefined,
        opacity: 0.7
      });
    }
  }

  updateRoute(route) {
    // Convert GeoJSON coordinates to LatLng objects
    const latLngs = route.geometry.coordinates.map(coord => L.latLng(coord[1], coord[0]));

    // Update the polyline
    this.polyline?.setLatLngs(latLngs);
    this.polyline?.setStyle({
      color: 'blue',
      dashArray: undefined,
      opacity: 0.7
    });

    // Store the route coordinates for the feature
    this.routeCoordinates = route.geometry.coordinates;
    this.routeDistance = route.distance;
  }

  // Get the current route as GeoJSON
  getRouteAsGeoJSON() {
    return {
      type: "LineString",
      coordinates: this.routeCoordinates || this.waypoints.map(latlng => [latlng.lng, latlng.lat])
    };
  }

  // Remove all markers from the map
  removeMarkers() {
    this.markers.forEach(marker => {
      this.map.removeLayer(marker);
    });
    this.markers = [];
  }
}