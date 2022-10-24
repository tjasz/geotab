import React, { useState } from 'react';
import DataView from './dataview.js'
import MapView from './mapview.js'
import TableView from './tableview.js'

const DataContext = React.createContext(null);

class TabView extends React.Component {
    constructor(props) {
      super(props);
      this.props = props;
      this.state = { Data: true, Map: false, Table: false};
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
          <TabBodies tabwidth={tabwidth} {...this.state}></TabBodies>
        </div>
      );
    }

    toggle(label) {
      this.setState((state, props) => ({
        [label]: !state[label]
      }));
    }
  }

function TabBodies(props) {
  const [data, setData] = useState(null);
  return (<div className="tabBodies">
    <DataContext.Provider value={data}>
    { props.Data && <DataView style={{width: props.tabwidth + '%'}} />}
    { props.Map && <MapView style={{width: props.tabwidth + '%'}} />}
    { props.Table && <TableView style={{width: props.tabwidth + '%'}} />}
    </DataContext.Provider>
  </div>);
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