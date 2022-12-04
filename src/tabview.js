import React from 'react';
import DataView from './dataview.js'
import MapView from './mapview.js'
import TableView from './tableview.js'
import SymbologyView from './symbologyview.js';

class TabView extends React.Component {
    constructor(props) {
      super(props);
      this.props = props;
      this.state = { Data: true, Map: false, Table: false, Symbology: false};
      this.toggle = this.toggle.bind(this);
    }
  
    render() {
      const tabwidth = 100 / Object.values(this.state).reduce(
        (accumulator, value) => value === true ? accumulator + 1 : accumulator, 0);
      return (
        <div id="tabview">
          <div className="tabs">
            {Object.keys(this.state).map(
              label => <Tab key={label} label={label} active={this.state[label]} toggle={this.toggle} />
            )}
          </div>
          <div className="tabBodies">
            { this.state.Data && <DataView style={{width: tabwidth + '%'}} />}
            { this.state.Map && <MapView style={{width: tabwidth + '%'}} />}
            { this.state.Table && <TableView style={{width: tabwidth + '%'}} />}
            { this.state.Symbology && <SymbologyView style={{width: tabwidth + '%'}} />}
          </div>
        </div>
      );
    }

    toggle(label) {
      this.setState((state, props) => ({
        [label]: !state[label]
      }));
    }
  }

class Tab extends React.Component {
    constructor(props) {
      super(props);
      this.toggleThis = this.toggleThis.bind(this);
    }

    toggleThis () {
      this.props.toggle(this.props.label);
    }
  
    render() {
      return (
        <p className={this.props.active ? 'tab active' : 'tab'} onClick={this.toggleThis}>
          {this.props.label}
        </p>
      );
    }
  }

export default TabView;