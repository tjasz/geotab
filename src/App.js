import React, { useState } from 'react';
import './App.css';
import TabView from './tabview.js'
import {DataContext} from './dataContext.js'

class App extends React.Component {
  constructor(props) {
    super(props);

    const sampleGeoJSON = {
      "type": "Feature",
      "properties": {
          "name": "Seattle",
      },
      "geometry": {
          "type": "Point",
          "coordinates": [-122.3, 47.5]
      }
    }; // TODO replace
    this.state = {
      data: sampleGeoJSON,
      setData: (newData) => {this.setState({data: newData})}
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
