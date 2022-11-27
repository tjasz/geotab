import React, {useContext, useState} from 'react';
import { useSearchParams } from "react-router-dom";
import {DataContext} from './dataContext.js'
import {getFeatures, getPropertiesUnion} from './algorithm.js'
import {defaultFilter, conditionOperators, conditionGroupOperators, parametersMap, operandTypes, Condition, ConditionGroup, filterEquals, filterTypes, validateFilter} from './filter.js'
import {ReactComponent as MinusSquare} from './feather/minus-square.svg'
import {ReactComponent as PlusSquare} from './feather/plus-square.svg'

function DataView(props) {
  const context = useContext(DataContext);
  const [urlParams, setUrlParams] = useSearchParams();
  const urlSrc = urlParams.get("src") ?? "wa-ultras";
  const setDataFromJson = (json) => {
    const flattened = getFeatures(json);
    context.setData(flattened);
    context.setColumns(getPropertiesUnion(flattened));
    context.setActive(null);
    context.setSorting(null);
    context.setFilter(defaultFilter);
    context.setSymbology(null)
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
  if (!context.data || !context.data.length) {
    processServerFile(`json/${urlSrc}.json`);
  }
  const onFilterSave = (draft) => {
    const errors = validateFilter(draft, context);
    if (errors) {
      alert(errors);
    } else {
      context.setFilter(draft); 
    }};
  return (
    <div id="dataview" style={props.style}>
      <input type="file" id="file-selector" />
      <button type="button" id="next-button" onClick={process}>Process</button>
      <p id="getting-started">Need an example file to try to the viewer? Try&nbsp;
      <a href="#" onClick={() => { setUrlParams({src: "backpacking-washington"}); processServerFile("json/backpacking-washington.json"); }}>Backpacking Washington</a>.</p>
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
      newConditions = [...conditions, new Condition("IsNotEmpty", context.columns[0].type, context.columns[0].name, {})];
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
    <div className="conditionGroupView" style={{paddingLeft: '2em'}}>
      <Select
        id={`condition-group-operator-${props.indent}`}
        name={`condition-group-operator-${props.indent}`}
        defaultValue={operator}
        onChange={onOperatorEdit}
        options={conditionGroupOperators}
        />
      {props.indent ? <MinusSquare className="removeCondition" onClick={() => {props.removeCondition(props.filter)}} /> : null}
      {conditions.map((condition, idx) => <FilterView filter={condition} indent={props.indent+1} indexInGroup={idx} onEdit={onChildEdit} removeCondition={onChildRemove} key={`condition-group-${props.indent}-child-${idx}`} />)}
      <PlusSquare className="addCondition" onClick={() => { setChildSelectorVisible(true); }} />
      {childSelectorVisible
      ? <div id={`condition-group-child-selector-${props.indent}`}>
        {filterTypes.map((ftype) => <button type="button" key={`condition-group-child-selector-${props.indent}-${ftype}`} onClick={(event) => { setChildSelectorVisible(false); onChildAdd(event.target.value); }} value={ftype}>{ftype}</button>)}
      </div>
      : null}
    </div>
  );
}

function ConditionView(props) {
  const context = useContext(DataContext);
  const [fieldname, setFieldname] = useState(props.filter.fieldname);
  const [operator, setOperator] = useState(props.filter.operator);
  const [operandType, setOperandType] = useState(props.filter.operandType);
  const [parameters, setParameters] = useState(props.filter.parameters);
  const [negate, setNegate] = useState(props.filter.negate);
  const onFieldnameEdit = (event) => {
    const column = context.columns.find((column) => column.name === event.target.value);
    if (column === undefined) { throw `Cannot find column with name ${event.target.value}.` }
    const newOperandType = operandTypes[operator] === "auto" ? column.type : operandTypes[operator];
    setFieldname(event.target.value);
    setOperandType(newOperandType);
    props.onEdit({type: "Condition", fieldname: event.target.value, operandType: newOperandType, operator, parameters, negate}, props.indexInGroup);
  };
  const onOperatorEdit = (event) => {
    const column = context.columns.find((column) => column.name === fieldname);
    if (column === undefined) { throw `Cannot find column with name ${event.target.value}.` }
    const newOperandType = operandTypes[event.target.value] === "auto" ? column.type : operandTypes[event.target.value];
    setOperandType(newOperandType);
    setOperator(event.target.value);
    setParameters(Object.keys(parametersMap[event.target.value]).reduce((accumulator, value) => {
      return {...accumulator, [value]: ''};
    }, {}));
    props.onEdit({type: "Condition", fieldname, operator: event.target.value, operandType: newOperandType, parameters, negate}, props.indexInGroup);
  };
  const onParameterEdit = (event) => {
    let value = event.target.value;
    setParameters(values => ({ ...values, [event.target.name]: value }));
    props.onEdit({type: "Condition", fieldname, operator, operandType, parameters: { ...parameters, [event.target.name]: value }, negate}, props.indexInGroup);
  };
  return (
    <div className="conditionView" style={{paddingLeft: '2em'}}>
      <Select 
        id={`${props.key}-fieldname`}
        name={`${props.key}-fieldname`}
        defaultValue={fieldname}
        onChange={onFieldnameEdit}
        options={context.columns.map((field) => field.name)}
        />

      <Select
        id={`${props.key}-operator`}
        name={`${props.key}-operator`}
        defaultValue={operator}
        onChange={onOperatorEdit}
        options={conditionOperators}
      />

      {Object.keys(parameters).map((param) =>
        <input id={`${props.key}-${param}`}
               name={param}
               defaultValue={parameters[param]}
               onChange={onParameterEdit}
               key={`${props.key}-${param}`}/>
      )}
      {props.indent ? <MinusSquare className="removeCondition" onClick={() => {props.removeCondition(props.filter)}} /> : null}
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

function Select(props) {
  return (
    <select {...props}>
      {props.options.map((option) => <option value={option} key={option}>{option}</option>)}
    </select>
  );
}

export default DataView;