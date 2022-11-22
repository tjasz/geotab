import React, {useContext, useState} from 'react';
import {DataContext} from './dataContext.js'
import {getFeatures, getPropertiesUnion} from './algorithm.js'
import {defaultFilter, conditionOperators, conditionGroupOperators, parametersMap, Condition, ConditionGroup, filterEquals, filterTypes} from './filter.js'

function DataView(props) {
  const context = useContext(DataContext);
  const setDataFromJson = (json) => {
    const flattened = getFeatures(json);
    context.setData(flattened);
    context.setColumns([...getPropertiesUnion(flattened)]);
    context.setActive(null);
    context.setSorting(null);
    context.setFilter(defaultFilter);
  };
  const process = () => {
    const fileSelector = document.getElementById('file-selector');
    const fname = fileSelector.files[0];
    const reader = new FileReader();
    reader.addEventListener('load', (event) => {
      const jso = JSON.parse(event.target.result);
      setDataFromJson(jso);
    });
    reader.readAsText(fname);
  };
  const processServerFile = (fname) => {
    fetch(fname,{
        headers : {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
         }
      })
      .then(res => res.json())
      .then(
        (result) => {
          setDataFromJson(result);
        },
        // Note: it's important to handle errors here
        // instead of a catch() block so that we don't swallow
        // exceptions from actual bugs in components.
        (error) => {
          alert(error);
        }
      )
  };
  const onFilterSave = (draft) => { context.setFilter(draft); };
  return (
    <div id="dataview" style={props.style}>
      <input type="file" id="file-selector" />
      <input type="button" id="next-button" value="Process" onClick={process} />
      <p id="getting-started">Need an example file to try to the viewer? Try&nbsp;
      <a href="#" onClick={() => { processServerFile("json/backpacking-washington.json"); }}>Backpacking Washington</a>.</p>
      {context.filter && <FilterDefinition filter={context.filter} onSave={onFilterSave} />}
    </div>
  );
}

function FilterDefinition(props) {
  const [draft, setDraft] = useState(props.filter);
  const saveDraft = () => { props.onSave(draft); };
  const updateDraft = (newDraft) => { setDraft(newDraft); };
  return (
    <div id="filter-definition">
      <h3>Filter</h3>
      <FilterView filter={props.filter} indent={0} indexInGroup={0} onEdit={updateDraft} />
      <button id="save-filter-draft" onClick={saveDraft}>Save</button>
    </div>
  );
}

function ConditionGroupView(props) {
  const context = useContext(DataContext);
  const [operator, setOperator] = useState(props.filter.operator);
  const [conditions, setConditions] = useState(props.filter.conditions);
  const [childSelectorVisible, setChildSelectorVisible] = useState(false);
  const onChildAdd = (ftype) => {
    let newConditions = null;
    if (ftype === "Condition") {
      newConditions = [...conditions, new Condition("IsNotEmpty", context.columns[0], {})];
      setConditions(newConditions);
    }
    else {
      newConditions = [...conditions, new ConditionGroup("and", [])];
      setConditions(newConditions);
    }
    props.onEdit({type: "ConditionGroup", operator, conditions: newConditions}, props.indexInGroup);
  };
  const onChildRemove = (child) => {
    const newConditions = conditions.filter((condition) => !filterEquals(condition, child));
    setConditions(newConditions);
    props.onEdit({type: "ConditionGroup", operator, conditions: newConditions}, props.indexInGroup);
  };
  const onChildEdit = (childState, idx) => {
    const newConditions = conditions.map((c, i) => i === idx ? childState : c);
    setConditions(newConditions);
    props.onEdit({type: "ConditionGroup", operator, conditions: newConditions}, props.indexInGroup);
  };
  const onOperatorEdit = (event) => {
    setOperator(event.target.value);
    props.onEdit({type: "ConditionGroup", operator: event.target.value, conditions}, props.indexInGroup);
  };
  return (
    <div className="conditionGroupView" style={{paddingLeft: `${props.indent*2}em`}}>
      <select id={`condition-group-operator-${props.indent}`}
              name={`condition-group-operator-${props.indent}`}
              defaultValue={operator}
              onChange={onOperatorEdit}>
        {conditionGroupOperators.map((operator) => <option value={operator} key={`condition-group-operator-${props.indent}-${operator}`}>{operator.toUpperCase()}</option>)}
      </select>
      {props.indent ? <a onClick={() => {props.removeCondition(props.filter)}}>-</a> : null}
      {conditions.map((condition, idx) => <FilterView filter={condition} indent={props.indent+1} indexInGroup={idx} onEdit={onChildEdit} removeCondition={onChildRemove} key={`condition-group-${props.indent}-child-${idx}`} />)}
      <a onClick={() => { setChildSelectorVisible(true); }}>+</a>
      {childSelectorVisible
      ? <div id={`condition-group-child-selector-${props.indent}`}>
        {filterTypes.map((ftype) => <input type="button" value={ftype} key={`condition-group-child-selector-${props.indent}-${ftype}`} onClick={(event) => { setChildSelectorVisible(false); onChildAdd(event.target.value); }} />)}
      </div>
      : null}
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
      {props.indent ? <a onClick={() => {props.removeCondition(props.filter)}}>-</a> : null}
    </div>
  );
}

function FilterView(props) {
  switch (props.filter.type) {
    case "ConditionGroup":
      return (<ConditionGroupView filter={props.filter} indent={props.indent} onEdit={props.onEdit} removeCondition={props.removeCondition} indexInGroup={props.indexInGroup} />);
    case "Condition":
      return (<ConditionView filter={props.filter} indent={props.indent} onEdit={props.onEdit} removeCondition={props.removeCondition} indexInGroup={props.indexInGroup} />);
    default:
      return (
        <div className="defaultFilterView" style={{paddingLeft: `${props.indent*2}em`}}>
          {JSON.stringify(props.filter)}
        </div>
      );
  }
}

export default DataView;