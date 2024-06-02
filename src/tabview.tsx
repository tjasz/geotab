import React from "react";
import DataView from "./dataview";
import MapView from "./mapview";
import TableView from "./table/tableview";
import SymbologyView from "./symbologyview";

enum TabName {
  Data = "Data",
  Map = "Map",
  Table = "Table",
  Symbology = "Symbology",
}

type TabViewProps = {};

type TabViewState = {
  [tabname in TabName]: boolean;
};

class TabView extends React.Component<TabViewProps, TabViewState> {
  constructor(props: TabViewProps) {
    super(props);
    this.state = { Data: true, Map: false, Table: false, Symbology: false };
    this.toggle = this.toggle.bind(this);
  }

  render() {
    const tabwidth =
      100 /
      Object.values(this.state).reduce(
        (accumulator, value) =>
          value === true ? accumulator + 1 : accumulator,
        0,
      );
    return (
      <div id="tabview">
        <div className="tabs">
          {Object.keys(this.state).map((label) => (
            <Tab
              key={label}
              label={label as TabName}
              active={this.state[label]}
              toggle={this.toggle}
            />
          ))}
        </div>
        <div className="tabBodies">
          {this.state.Data && <DataView style={{ width: tabwidth + "%" }} />}
          {this.state.Map && <MapView style={{ width: tabwidth + "%" }} />}
          {this.state.Table && <TableView style={{ width: tabwidth + "%" }} />}
          {this.state.Symbology && (
            <SymbologyView style={{ width: tabwidth + "%" }} />
          )}
        </div>
      </div>
    );
  }

  toggle(label: TabName) {
    this.setState((state: Readonly<TabViewState>) => ({
      ...state,
      [label]: !state[label],
    }));
  }
}

type TabProps = {
  toggle: { (tabname: TabName): void };
  label: TabName;
  active: boolean;
};

class Tab extends React.Component<TabProps> {
  constructor(props: TabProps) {
    super(props);
    this.toggleThis = this.toggleThis.bind(this);
  }

  toggleThis() {
    this.props.toggle(this.props.label);
  }

  render() {
    return (
      <p
        className={this.props.active ? "tab active" : "tab"}
        onClick={this.toggleThis}
      >
        {this.props.label}
      </p>
    );
  }
}

export default TabView;
