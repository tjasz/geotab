import React from 'react';

class DataView extends React.Component {
    constructor(props) {
      super(props);
    }
  
    render() {
      return (
        <div id="dataview" style={this.props.style}>
          <input type="file" id="file-selector" />
          <input type="button" id="next-button" value="Process" />
          <p id="getting-started">Need an example file to try to the viewer? Try <a href="data/Backpacking_Washington.json">Backpacking Washington</a>.</p>
        </div>
      );
    }
  }

export default DataView;