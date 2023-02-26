import React, {useContext} from 'react';
import {BrowserRouter} from 'react-router-dom'
import './App.css';
import TabView from './tabview'
import {DataContextType, DataContext} from './dataContext'
import { evaluateFilter } from './filter';
import { GeotabLogo } from './icon/GeotabLogo';
import { GoogleLogin } from './google-drive'
import {getFeatures, getPropertiesUnion} from './algorithm'

interface IAppProps {
}

type IState = DataContextType;

class App extends React.Component<IAppProps, IState> {
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
          filteredData: newData.filter((row) => evaluateFilter(row, this.state?.filter))
        });
      },
      setFilter: (newFilter) => {
        this.setState({
          filter: newFilter,
          filteredData: this.state?.data.filter((row) => evaluateFilter(row, newFilter))
        });
      },
      setDataAndFilter: (newData, newFilter) => {
        this.setState({
          data: newData,
          filter: newFilter,
          filteredData: newData.filter((row) => evaluateFilter(row, newFilter))
        });
      },
      setColumns: (newColumns) => {
        // ensure pseudo-column "geotab:selectionStatus" is always present
        if (!newColumns.some((c) => c.name === "geotab:selectionStatus")) {
          newColumns.push({
            name: "geotab:selectionStatus",
            visible: false,
            type: "string",
          })
        }
        this.setState({columns: newColumns})
      },
      setActive: (newActive) => {this.setState({active: newActive})},
      setSymbology: (newSymbology) => {this.setState({symbology: newSymbology})},
      setFromJson: (json) => {
        const flattened = getFeatures(json);
        if (flattened.length) {
          if (this.state && this.state.data.length === 0) {
            if (json.geotabMetadata) {
              this.setState({
                data: flattened,
                filter: json.geotabMetadata.filter,
                filteredData: flattened.filter((row) => evaluateFilter(row, json.geotabMetadata.filter)),
                columns: json.geotabMetadata.columns,
                active: null,
                symbology: json.geotabMetadata.symbology,
              });
            } else {
              this.setState({
                data: this.state ? this.state.data.concat(flattened) : flattened,
                filteredData: flattened.filter((row) => evaluateFilter(row, this.state?.filter)),
                columns: getPropertiesUnion(flattened, this.state?.columns),
                active: null,
              });
            }
          } else {
            const newData = this.state ? this.state.data.concat(flattened) : flattened;
            this.setState({
              data: newData,
              filteredData: newData.filter((row) => evaluateFilter(row, this.state?.filter)),
              columns: getPropertiesUnion(newData, this.state?.columns),
              active: null,
            });
          }
        }
      },
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
  const context = useContext(DataContext);
  return (
    <header id="App-header">
      <div id="logoDiv">
        <div className="verticalCentering">
          <GeotabLogo />
        </div>
      </div>
      <div id="appNameDiv">
        <h1>geotab</h1>
      </div>
      <div id="googleLoginDiv">
        <GoogleLogin onRead={context?.setFromJson} />
      </div>
    </header>
  );
}

function AppFooter() {
  return (
    <footer id="App-footer">
      <p>&copy; 2023 Tyler Jaszkowiak</p>
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
