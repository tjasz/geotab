import React from 'react';
import {BrowserRouter} from 'react-router-dom'
import './App.css';
import TabView from './tabview.js'
import {DataContext} from './dataContext.js'
import { evaluateFilter } from './filter';

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      data: [],
      filter: null,
      filteredData: [],
      columns: [],
      active: null,
      symbology: null,
      setData: (newData) => {
        this.setState({
          data: newData,
          filteredData: newData.filter((row) => evaluateFilter(row, this.state.filter))
        });
      },
      setFilter: (newFilter) => {
        this.setState({
          filter: newFilter,
          filteredData: this.state.data.filter((row) => evaluateFilter(row, newFilter))
        });
      },
      setDataAndFilter: (newData, newFilter) => {
        this.setState({
          data: newData,
          filter: newFilter,
          filteredData: newData.filter((row) => evaluateFilter(row, newFilter))
        });
      },
      setColumns: (newColumns) => {this.setState({columns: newColumns})},
      setActive: (newActive) => {this.setState({active: newActive})},
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
