import React, {useContext} from 'react';
import {DataContext} from './dataContext.js'

function SymbologyView(props) {
  const context = useContext(DataContext);
  return (
    <div id="symbologyview" style={props.style}>
      <h2>Symbology</h2>
      <SymbologyDefinition symbology={context.symbology} />
    </div>
  );
}

function SymbologyDefinition(props) {
  return (
    <div id="symbology-definition">
    </div>
  );
}

export default SymbologyView;