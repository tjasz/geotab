import React from 'react';

function DataView(props) {
      return (
        <div id="dataview" style={props.style}>
          <input type="file" id="file-selector" />
          <input type="button" id="next-button" value="Process" />
          <p id="getting-started">Need an example file to try to the viewer? Try <a href="data/Backpacking_Washington.json">Backpacking Washington</a>.</p>
        </div>
      );
    }

export default DataView;