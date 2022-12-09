import React, {useContext, useState} from 'react';
import { useSearchParams } from "react-router-dom";
import gpxParser from './gpx-parser.js'
import {DataContext} from './dataContext.js'
import {getFeatures, getPropertiesUnion, csvToJson} from './algorithm.js'
import {defaultFilter, conditionOperators, conditionGroupOperators, parametersMap, operandTypes, Condition, ConditionGroup, filterEquals, filterTypes, validateFilter} from './filter.js'
import {ReactComponent as MinusSquare} from './feather/minus-square.svg'
import {ReactComponent as PlusSquare} from './feather/plus-square.svg'
import {Select} from './common-components.js'

function DataView(props) {
  const context = useContext(DataContext);
  const onFilterSave = (draft) => {
    const errors = validateFilter(draft, context);
    if (errors && errors !== "") {
      alert(errors);
    } else {
      context.setFilter(draft); 
    }};
  return (
    <div id="dataview" style={props.style}>
      <h2>Data</h2>
      <ImportView />
      <ExportView />
      {context.filter && <FilterDefinition filter={context.filter} onSave={onFilterSave} />}
    </div>
  );
}

function ImportView(props) {
  const context = useContext(DataContext);
  const [urlParams, setUrlParams] = useSearchParams();
  const urlSrc = urlParams.get("src") ?? "wa-ultras";
  const setDataFromJson = (json) => {
    const flattened = getFeatures(json);
    context.setDataAndFilter(flattened, defaultFilter);
    context.setColumns(getPropertiesUnion(flattened));
    context.setActive(null);
    context.setSymbology(null)
  };
  const processServerFiles = (fnames) => {
    const fetchPromises = fnames.map((fname) => 
      fetch(`json/${fname}.json`,{
        headers : {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
         }
      })
    );
    Promise.all(fetchPromises).then((fileContents) => {
      const jsonPromises = fileContents.map((file) => file.json());
      Promise.all(jsonPromises).then((jsons) => {
        setDataFromJson({ type: "FeatureCollection", features: jsons });
      });
    });
  }
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
    processServerFiles(urlSrc.split(','));
  }
  return (
    <div id="importView">
      <h3>Import</h3>
      <FileImporter onRead={setDataFromJson} />
      <p>Try pre-loaded data:</p>
      <ul>
        <li>
          <button onClick={() => { setUrlParams({src: "backpacking-washington"}); processServerFile("json/backpacking-washington.json"); }}>
            Backpacking Washington
          </button>
        </li>
        <li>
          <button onClick={() => { setUrlParams({src: "wa-ultras"}); processServerFile("json/wa-ultras.json"); }}>
            Washington Most Prominent Peaks
          </button>
        </li>
      </ul>
    </div>
  );
}

function readFileAsync(fname) {
  return new Promise((resolve, reject) => {
    let reader = new FileReader();

    reader.onload = () => {
      resolve(reader.result);
    };

    reader.onerror = reject;

    reader.readAsText(fname);
  })
}

function tryToJson(text) {
  const errors = [];
  let jso = null;
  try {
    // try JSON
    jso = JSON.parse(text);
  }
  catch (e) {
    errors.push(e);
    try {
      // try CSV
      jso = csvToJson(text);
    }
    catch (e) {
      errors.push(e);
      try {
        // try GPX
        const gpx = new gpxParser();
        gpx.parse(text).calculate();
        jso = gpx.toGeoJSON();
      }
      catch (e) {
        errors.push(e);
      }
    }
  }
  if (!jso) {
    throw Error(`File could not be read as geoJSON, CSV, or GPX: ${errors}`);
  }
  return jso;
}

function FileImporter({onRead}) {
  const process = () => {
    const fileSelector = document.getElementById('file-selector');
    const promises = [];
    for (let i = 0; i < fileSelector.files.length; i++) {
      promises.push(readFileAsync(fileSelector.files.item(i)));
    }
    Promise.all(promises).then((fileContents) => {
      const features = fileContents.map((file) => tryToJson(file)).filter((j) => j !== null);
      const json = { type: "FeatureCollection", features }
      onRead(json);
    });
  };
  return (
    <div className="fileImporter">
      <input type="file" id="file-selector" multiple />
      <button type="button" id="next-button" onClick={process}>Process</button>
    </div>
  );
}

function ExportView(props) {
  const context = useContext(DataContext);
  const exportJson = () => {
    const downloadLink = document.createElement("a");
    const textContent = JSON.stringify({
      type: "FeatureCollection",
      // TODO option to save filtered or unfiltered data
      features: context.filteredData
    });
    const file = new Blob([textContent], {type: 'text/plain'});
    downloadLink.href = URL.createObjectURL(file);
    downloadLink.download = "geotabExport.json";
    document.body.appendChild(downloadLink); // Required for this to work in FireFox
    downloadLink.click();
  };
  return (
    <div id="exportView">
      <h3>Export</h3>
      <button onClick={exportJson}>Export .json</button>
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
      {props.indent ? <MinusSquare className="removeButton" onClick={() => {props.removeCondition(props.filter)}} /> : null}
      {conditions.map((condition, idx) => <FilterView filter={condition} indent={props.indent+1} indexInGroup={idx} onEdit={onChildEdit} removeCondition={onChildRemove} key={`condition-group-${props.indent}-child-${idx}`} />)}
      <PlusSquare className="addButton" onClick={() => { setChildSelectorVisible(true); }} />
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
  const onNegateEdit = (event) => {
    setNegate(event.target.checked);
    props.onEdit({type: "Condition", fieldname, operandType, operator, parameters, negate: event.target.checked}, props.indexInGroup);
  }
  const onFieldnameEdit = (event) => {
    const column = context.columns.find((column) => column.name === event.target.value);
    if (column === undefined) { throw Error(`Cannot find column with name ${event.target.value}.`) }
    const newOperandType = operandTypes[operator] === "auto" ? column.type : operandTypes[operator];
    setFieldname(event.target.value);
    setOperandType(newOperandType);
    props.onEdit({type: "Condition", fieldname: event.target.value, operandType: newOperandType, operator, parameters, negate}, props.indexInGroup);
  };
  const onOperatorEdit = (event) => {
    const column = context.columns.find((column) => column.name === fieldname);
    if (column === undefined) { throw Error(`Cannot find column with name ${event.target.value}.`) }
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
      <input
        type="checkbox"
        checked={negate}
        onChange={onNegateEdit}
        />
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
      {props.indent ? <MinusSquare className="removeButton" onClick={() => {props.removeCondition(props.filter)}} /> : null}
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