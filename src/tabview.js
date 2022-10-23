import React from 'react';
import MapView from './mapview.js'

class TabView extends React.Component {
    constructor(props) {
      super(props);
      this.props = props;
      this.state = { Map: true, Table: true};
      this.toggle = this.toggle.bind(this);
    }
  
    render() {
      return (
        <div id="tabview">
          <div className="tabs">
            {Object.keys(this.state).map(
              label => <Tab key={label} label={label} active={this.state[label]} toggle={this.toggle} />
            )}
          </div>
          { this.state.Map ? <MapView /> : null}
        </div>
      );
    }

    toggle(label) {
      console.log(`toggle: ${label} from ${this.state[label]}`)
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