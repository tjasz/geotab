import React, {useContext, useState} from 'react';
import {DataContext} from './dataContext.js'
import {getFeatures, getPropertiesUnion} from './algorithm.js'
import {defaultFilter, conditionOperators, conditionGroupOperators, parametersMap} from './filter.js'

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
      context.setColumns([...getPropertiesUnion(flattened)]);
      context.setActive(null);
      context.setSorting(null);
      context.setFilter(defaultFilter);
    });
    reader.readAsText(fname);
  };
  const onFilterSave = (draft) => { context.setFilter(draft); };
  return (
    <div id="dataview" style={props.style}>
      <input type="file" id="file-selector" />
      <input type="button" id="next-button" value="Process" onClick={process} />
      <p id="getting-started">Need an example file to try to the viewer? Try <a href="data/Backpacking_Washington.json">Backpacking Washington</a>.</p>
      <FilterDefinition filter={context.filter} onSave={onFilterSave} />
    </div>
  );
}

function FilterDefinition(props) {
  const saveDraft = () => { props.onSave(props.filter); };
  const updateDraft = (newDraft) => { ; }; // props.filter is not editable. only properties down the tree are
  return (
    <div id="filter-definition">
      <h3>Filter</h3>
      <FilterView filter={props.filter} indent={0} indexInGroup={0} onEdit={updateDraft} />
      <button id="save-filter-draft" onClick={saveDraft}>Save</button>
    </div>
  );
}

function ConditionGroupView(props) {
  const onChildEdit = (childState, idx) => {
    props.filter.conditions[idx] = childState;
    props.onEdit(props.filter, props.indexInGroup);
  };
  const onOperatorEdit = (event) => {
    props.filter.operator = event.target.value;
    props.onEdit(props.filter, props.indexInGroup);
  };
  return (
    <div className="conditionGroupView" style={{paddingLeft: `${props.indent*2}em`}}>
      <select id={`condition-group-operator-${props.indent}`}
              name={`condition-group-operator-${props.indent}`}
              defaultValue={props.filter.operator}
              onChange={onOperatorEdit}>
        {conditionGroupOperators.map((operator) => <option value={operator} key={`condition-group-operator-${props.indent}-${operator}`}>{operator.toUpperCase()}</option>)}
      </select>
      {props.filter.conditions.map((condition, idx) => <FilterView filter={condition} indent={props.indent+1} indexInGroup={idx} onEdit={onChildEdit} key={`condition-group-${props.indent}-child-${idx}`} />)}
    </div>
  );
}

function ConditionView(props) {
  const context = useContext(DataContext);
  const [fieldname, setFieldname] = useState(props.filter.fieldname);
  const [operator, setOperator] = useState(props.filter.operator);
  const [parameters, setParameters] = useState(props.filter.parameters);
  const [negate, setNegate] = useState(props.filter.negate);
  const onFieldnameEdit = (event) => {
    setFieldname(event.target.value);
    props.onEdit({type: "Condition", fieldname: event.target.value, operator, parameters, negate}, props.indexInGroup);
  };
  const onOperatorEdit = (event) => {
    setOperator(event.target.value);
    setParameters(parametersMap[event.target.value].reduce((accumulator, value) => {
      return {...accumulator, [value]: ''};
    }, {}));
    props.onEdit({type: "Condition", fieldname, operator: event.target.value, parameters, negate}, props.indexInGroup);
  };
  const onParameterEdit = (event) => {
    setParameters(values => ({ ...values, [event.target.name]: event.target.value }));
    props.onEdit({type: "Condition", fieldname, operator, parameters: { ...parameters, [event.target.name]: event.target.value }, negate}, props.indexInGroup);
  };
  return (
    <div className="conditionView" style={{paddingLeft: `${props.indent*2}em`}}>
      <select id={`${props.key}-fieldname`}
              name={`${props.key}-fieldname`}
              defaultValue={fieldname}
              onChange={onFieldnameEdit}>
        {context.columns.map((fieldname) => <option value={fieldname} key={`${props.key}-${fieldname}`}>{fieldname}</option>)}
      </select>

      <select id={`${props.key}-operator`}
              name={`${props.key}-operator`}
              defaultValue={operator}
              onChange={onOperatorEdit}>
        {conditionOperators.map((operator) => <option value={operator} key={`${props.key}-${operator}`}>{operator}</option>)}
      </select>

      {Object.keys(parameters).map((param) =>
        <input id={`${props.key}-${param}`}
               name={param}
               defaultValue={parameters[param]}
               onChange={onParameterEdit}
               key={`${props.key}-${param}`}/>
      )}
    </div>
  );
}

function FilterView(props) {
  switch (props.filter.type) {
    case "ConditionGroup":
      return (<ConditionGroupView filter={props.filter} indent={props.indent} onEdit={props.onEdit} indexInGroup={props.indexInGroup} />);
    case "Condition":
      return (<ConditionView filter={props.filter} indent={props.indent} onEdit={props.onEdit} indexInGroup={props.indexInGroup} />);
    default:
      return (
        <div className="defaultFilterView" style={{paddingLeft: `${props.indent*2}em`}}>
          {JSON.stringify(props.filter)}
        </div>
      );
  }
}

export default DataView;