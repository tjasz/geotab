import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';

class MapView extends React.Component {
    constructor(props) {
      super(props);
    }
  
    componentDidMount() {
    }
  
    componentWillUnmount() {
    }
  
    render() {
      return (
        <div id="mapview">
          <MapContainer center={[45.4, -75.7]} zoom={12}scrollWheelZoom={false}>
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            />
          </MapContainer>
        </div>
      );
    }
  }

export default MapView;