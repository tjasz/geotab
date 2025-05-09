import React, { useContext } from "react";
import { BrowserRouter } from "react-router-dom";
import * as GeoJson from "./geojson-types";
import "./App.css";
import {
  DataContextType,
  DataContext,
  UpdaterOrValue,
  getValueFromUpdaterOrValue,
  GeotabMetadata,
  FeatureListener,
} from "./dataContext";
import { ConditionGroup, evaluateFilter } from "./filter";
import { GeotabLogo } from "./icon/GeotabLogo";
import { GoogleSessionContainer } from "./google-drive";
import { getFeatures, getPropertiesUnion } from "./algorithm";
import { FieldTypeDescription } from "./fieldtype";
import { Column } from "./column";
import { Symbology } from "./symbology/painter";
import { add_operations } from "./json-logic/root";
import PanelView from "./PanelView";
import DataView from "./dataview";
import MapView from "./mapview";
import TableView from "./table/tableview";
import SymbologyView from "./symbology/SymbologyView";

interface IAppProps { }

type IState = DataContextType;

class App extends React.Component<IAppProps, IState> {
  constructor(props) {
    super(props);

    this.state = {
      data: [],
      filter: null,
      filteredData: [],
      columns: [],
      symbology: null,
      featureListeners: { table: {}, map: {} },
      setData: this.setData.bind(this),
      setFilter: this.setFilter.bind(this),
      setDataAndFilter: this.setDataAndFilter.bind(this),
      setColumns: this.setColumns.bind(this),
      setSymbology: this.setSymbology.bind(this),
      setFeatureListener: this.setListener.bind(this),
      setFromJson: this.setFromJson.bind(this),
    };

    add_operations();
  }

  setData(newDataOrUpdator: UpdaterOrValue<GeoJson.Feature[]>) {
    const newData = getValueFromUpdaterOrValue(
      newDataOrUpdator,
      this.state?.data,
    );
    this.setState({
      data: newData,
      filteredData: newData?.filter((row) =>
        evaluateFilter(row, this.state?.filter),
      ),
    });
  }
  setFilter(newFilterOrUpdater: UpdaterOrValue<ConditionGroup | undefined>) {
    const newFilter = getValueFromUpdaterOrValue(
      newFilterOrUpdater,
      this.state?.filter,
    );
    this.setState({
      filter: newFilter,
      filteredData: this.state?.data.filter((row) =>
        evaluateFilter(row, newFilter),
      ),
    });
  }
  setDataAndFilter(
    newDataOrUpdator: UpdaterOrValue<GeoJson.Feature[]>,
    newFilterOrUpdater: UpdaterOrValue<ConditionGroup | undefined>,
  ) {
    const newData = getValueFromUpdaterOrValue(
      newDataOrUpdator,
      this.state?.data,
    );
    const newFilter = getValueFromUpdaterOrValue(
      newFilterOrUpdater,
      this.state?.filter,
    );
    this.setState({
      data: newData,
      filter: newFilter,
      filteredData: newData?.filter((row) => evaluateFilter(row, newFilter)),
    });
  }
  setColumns(newColumnsOrUpdater: UpdaterOrValue<Column[]>) {
    const newColumns = getValueFromUpdaterOrValue(
      newColumnsOrUpdater,
      this.state?.columns,
    );
    this.setState({ columns: withSelectionStatus(newColumns ?? []) });
  }
  setSymbology(newSymbologyOrUpdater: UpdaterOrValue<Symbology | null>) {
    const newSymbology = getValueFromUpdaterOrValue(
      newSymbologyOrUpdater,
      this.state?.symbology,
    );
    this.setState({ symbology: newSymbology });
  }
  setListener(view: "table" | "map", id: string, f: FeatureListener) {
    if (this.state === null) return;
    this.state.featureListeners[view][id] = f;
  }
  setFromJson(
    json: GeoJson.FeatureCollection & { geotabMetadata?: GeotabMetadata },
  ) {
    const flattened = getFeatures(json);
    if (flattened.length) {
      if (this.state && this.state.data.length === 0) {
        if (json.geotabMetadata !== undefined) {
          this.setState({
            data: flattened,
            filter: json.geotabMetadata.filter,
            filteredData: flattened.filter((row) =>
              evaluateFilter(row, json.geotabMetadata!.filter),
            ),
            columns: withSelectionStatus(json.geotabMetadata.columns),
            active: null,
            symbology: json.geotabMetadata.symbology,
          });
        } else {
          this.setState({
            data: this.state ? this.state.data.concat(flattened) : flattened,
            filteredData: flattened.filter((row) =>
              evaluateFilter(row, this.state?.filter),
            ),
            columns: withSelectionStatus(
              getPropertiesUnion(flattened, this.state?.columns),
            ),
            active: null,
          });
        }
      } else {
        const newData = this.state
          ? this.state.data.concat(flattened)
          : flattened;
        this.setState({
          data: newData,
          filteredData: newData.filter((row) =>
            evaluateFilter(row, this.state?.filter),
          ),
          columns: withSelectionStatus(
            getPropertiesUnion(newData, this.state?.columns),
          ),
          active: null,
        });
      }
    }
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
          <a href=".">
            <GeotabLogo />
          </a>
        </div>
      </div>
      <div id="appNameDiv">
        <h1>
          <a href=".">geotab</a>
        </h1>
        <p>View, interact with, and edit geographical/tabular data.</p>
      </div>
      <GoogleSessionContainer onRead={context?.setFromJson} />
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
      <PanelView
        leftPanel={
          <DataView />
        }
        rightPanel={
          <TableView style={{}} />
        }
        bottomPanel={
          <SymbologyView />
        }
        leftPanelTitle="Data"
        rightPanelTitle="Table"
        bottomPanelTitle="Symbology"
        leftPanelWidth={300}
        rightPanelWidth={0}
        bottomPanelHeight={0}
      >
        <MapView style={{ width: "100%" }} />
      </PanelView>
    </div>
  );
}

function withSelectionStatus(columns: Column[]) {
  const newColumns = columns.slice();
  // ensure pseudo-column "geotab:selectionStatus" is always present
  if (!newColumns.some((c) => c.name === "geotab:selectionStatus")) {
    newColumns.push({
      name: "geotab:selectionStatus",
      visible: false,
      type: FieldTypeDescription.String,
    });
  }
  return newColumns;
}

export default App;
