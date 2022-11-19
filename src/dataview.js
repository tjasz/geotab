import React, {useContext} from 'react';
import {DataContext} from './dataContext.js'
import {getFeatures} from './algorithm.js'

function DataView(props) {
  const context = useContext(DataContext);
  const process = () => {
    const fileSelector = document.getElementById('file-selector');
    const fname = fileSelector.files[0];
    const reader = new FileReader();
    reader.addEventListener('load', (event) => {
      const jso = JSON.parse(event.target.result);
      const flattened = getFeatures(jso);
      context.setData(flattened);
      context.setActive(null);
      context.setSorting([]);
    });
    reader.readAsText(fname);
  };
  return (
    <div id="dataview" style={props.style}>
      <input type="file" id="file-selector" />
      <input type="button" id="next-button" value="Process" onClick={process} />
      <p id="getting-started">Need an example file to try to the viewer? Try <a href="data/Backpacking_Washington.json">Backpacking Washington</a>.</p>
    </div>
  );
}

export default DataView;