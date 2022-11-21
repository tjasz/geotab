import React, {useContext} from 'react';
import {DataContext} from './dataContext.js'
import {getFeatures, getPropertiesUnion} from './algorithm.js'
import {defaultFilter} from './filter.js'

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
      context.setColumns(getPropertiesUnion(flattened));
      context.setActive(null);
      context.setSorting(null);
      context.setFilter(defaultFilter);
    });
    reader.readAsText(fname);
  };
  return (
    <div id="dataview" style={props.style}>
      <input type="file" id="file-selector" />
      <input type="button" id="next-button" value="Process" onClick={process} />
      <p id="getting-started">Need an example file to try to the viewer? Try <a href="data/Backpacking_Washington.json">Backpacking Washington</a>.</p>
      <FilterDefinition filter={context.filter} />
    </div>
  );
}

function FilterDefinition(props) {
  return (
    <div id="filter-definition">
      <h3>Filter</h3>
      <ConditionGroupView group={props.filter} />
    </div>
  );
}

function ConditionGroupView(props) {
  return (
    <p>{JSON.stringify(props.group)}</p>
  );
  // switch (props.group.type) {
  //   case "ConditionGroup":
  //   case "Condition":
  //     return (

  //     );
  // }
}

export default DataView;