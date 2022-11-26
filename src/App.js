import React from 'react';
import {BrowserRouter} from 'react-router-dom'
import './App.css';
import TabView from './tabview.js'
import {DataContext} from './dataContext.js'

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      data: [],
      setData: (newData) => {this.setState({data: newData})},
      columns: [],
      setColumns: (newColumns) => {this.setState({columns: newColumns})},
      active: null,
      setActive: (newActive) => {this.setState({active: newActive})},
      sorting: null,
      setSorting: (newSorting) => {this.setState({sorting: newSorting})},
      filter: null,
      setFilter: (newFilter) => {this.setState({filter: newFilter})},
      symbology: {
        "hue": {mode: "discrete", values: [209], fieldname: null, breaks: []},
        "saturation": {mode: "discrete", values: [50], fieldname: null, breaks: []},
        "lightness": {mode: "discrete", values: [40], fieldname: null, breaks: []},
        "alpha": {mode: "discrete", values: [1], fieldname: null, breaks: []},
      },
      setSymbology: (newSymbology) => {this.setState({symbology: newSymbology})},
    };
  }

  render() {
    return (
      <div id="App">
        <DataContext.Provider value={this.state}>
          <AppHeader />
          <BrowserRouter>
            <AppBody />
          </BrowserRouter>
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
