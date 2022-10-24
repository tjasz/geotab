import React, { useState } from 'react';
import './App.css';
import TabView from './tabview.js'
import {DataContext} from './dataContext.js'

class App extends React.Component {
  constructor(props) {
    super(props);

    const sampleGeoJSON = [
      { "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [102.0, 0.5]},
        "properties": {"prop0": "value0"}
        },
      { "type": "Feature",
        "geometry": {
          "type": "LineString",
          "coordinates": [
            [102.0, 0.0], [103.0, 1.0], [104.0, 0.0], [105.0, 1.0]
            ]
          },
        "properties": {
          "prop0": "value0",
          "prop1": 0.0
          }
        },
      { "type": "Feature",
         "geometry": {
           "type": "Polygon",
           "coordinates": [
             [ [100.0, 0.0], [101.0, 0.0], [101.0, 1.0],
               [100.0, 1.0], [100.0, 0.0] ]
             ]
  
         },
         "properties": {
           "prop0": "value0",
           "prop2": {"this": "that"}
           }
         }
      ]; // TODO replace
    this.state = {
      data: sampleGeoJSON,
      setData: (newData) => {this.setState({data: newData})},
      active: null,
      setActive: (newActive) => {this.setState({active: newActive})}
    };
  }

  render() {
    return (
      <div id="App">
        <DataContext.Provider value={this.state}>
          <AppHeader />
          <AppBody />
          <AppFooter />
        </DataContext.Provider>
      </div>
    );
  }
}

function AppHeader() {
  return (
    <header id="App-header">
        <h1>OpenRoutes</h1>
        <p>An open tool for viewing and filtering GPS routes.</p>
      </header>
  );
}

function AppFooter() {
  return (
    <footer id="App-footer">
        <p>&copy; 2022 Tyler Jaszkowiak</p>
      </footer>
  );
}

function AppBody() {
  return (
    <div id="App-body">
      <TabView />
    </div>
  );
}

export default App;
