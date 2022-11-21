import React from 'react';
import './App.css';
import TabView from './tabview.js'
import {DataContext} from './dataContext.js'
import {getFeatures, getPropertiesUnion} from './algorithm.js'
import {Condition, ConditionGroup} from './filter.js'

class App extends React.Component {
  constructor(props) {
    super(props);

    const sampleGeoJSON = {
      "type": "FeatureCollection",
      "features": [
        {
          "type": "Feature",
          "geometry": {
            "type": "Point",
            "coordinates": [-121.7604, 46.8529]
          },
          "properties": {
            "title": "Rainier, Mount",
            "elevation": "14410",
            "prominence": "13262",
            "county": "Pierce",
            "national park": "Mount Rainier",
            "wilderness": "Mount Rainier",
            "forest": ""
          }
        },
        {
          "type": "Feature",
          "geometry": {
            "type": "Point",
            "coordinates": [-121.8144, 48.7768]
          },
          "properties": {
            "title": "Baker, Mount",
            "elevation": "10781",
            "prominence": "8846",
            "county": "Whatcom",
            "national park": "",
            "wilderness": "Mount Baker",
            "forest": "Mount Baker"
          }
        },
        {
          "type": "Feature",
          "geometry": {
            "type": "Point",
            "coordinates": [-121.4906, 46.2025]
          },
          "properties": {
            "title": "Adams, Mount",
            "elevation": "12276",
            "prominence": "8136",
            "county": "Yakima",
            "national park": "",
            "wilderness": "Mount Adams",
            "forest": "Gifford Pinchot"
          }
        },
        {
          "type": "Feature",
          "geometry": {
            "type": "Point",
            "coordinates": [-123.7107, 47.8014]
          },
          "properties": {
            "title": "Olympus, Mount",
            "elevation": "7969",
            "prominence": "7838",
            "county": "Jefferson",
            "national park": "Olympic",
            "wilderness": "Olympic",
            "forest": ""
          }
        },
        {
          "type": "Feature",
          "geometry": {
            "type": "Point",
            "coordinates": [-121.1132, 48.1119]
          },
          "properties": {
            "title": "Glacier Peak",
            "elevation": "10540",
            "prominence": "7520",
            "county": "Snohomish",
            "national park": "",
            "wilderness": "Glacier Peak",
            "forest": "Mount Baker"
          }
        },
        {
          "type": "Feature",
          "geometry": {
            "type": "Point",
            "coordinates": [-120.9022, 47.4751]
          },
          "properties": {
            "title": "Stuart, Mount",
            "elevation": "9415",
            "prominence": "5359",
            "county": "Chelan",
            "national park": "",
            "wilderness": "Alpine Lakes",
            "forest": "Wenatchee"
          }
        },
        {
          "type": "Feature",
          "geometry": {
            "type": "Point",
            "coordinates": [-117.46, 48.9281]
          },
          "properties": {
            "title": "Abercrombie Mountain",
            "elevation": "7308",
            "prominence": "5178",
            "county": "Stevens",
            "national park": "",
            "wilderness": "",
            "forest": "Colville"
          }
        }
      ]
    }; // TODO replace
    const sampleFilter = new ConditionGroup("and",
    [
      new Condition("GreaterThan", "elevation", {value: 10000}),
    ]
  );
    this.state = {
      data: getFeatures(sampleGeoJSON),
      setData: (newData) => {this.setState({data: newData})},
      columns: getPropertiesUnion(getFeatures(sampleGeoJSON)),
      setColumns: (newColumns) => {this.setState({columns: newColumns})},
      active: null,
      setActive: (newActive) => {this.setState({active: newActive})},
      sorting: null,
      setSorting: (newSorting) => {this.setState({sorting: newSorting})},
      filter: sampleFilter,
      setFilter: (newFilter) => {this.setState({filter: newFilter})},
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
      <h1>geotab</h1>
      <p>View, interact with, and edit geographical/tabular data.</p>
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
