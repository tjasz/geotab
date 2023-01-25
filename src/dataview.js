import React, {useContext, useState} from 'react';
import { useSearchParams } from "react-router-dom";
import {DataContext} from './dataContext'
import {getFeatures, getPropertiesUnion} from './algorithm'
import {defaultFilter, ConditionOperator, ConditionGroupOperator, parametersMap, operandTypes, Condition, ConditionGroup, filterEquals, FilterType, validateFilter} from './filter'
import {FieldType} from './fieldtype'
import {ReactComponent as MinusSquare} from './feather/minus-square.svg'
import {ReactComponent as PlusSquare} from './feather/plus-square.svg'
import {Select} from './common-components'
import {LabeledCheckbox} from './LabeledCheckbox'
import {parseFile, attachProgress} from './readfile'
import { GoogleLogin } from './google-drive'

function DataView(props) {
  const context = useContext(DataContext);
  const onFilterSave = (draft) => {
    const errors = validateFilter(draft, context);
    if (errors && errors !== "") {
      alert(errors);
    } else if (!filterEquals(draft, context.filter)) {
      context.setFilter(draft); 
    }};
  return (
    <div id="dataview" style={props.style}>
      <h2>Data</h2>
      <ImportView />
      <ExportView />
      {context.data?.length ? <FilterDefinition filter={context.filter} onSave={onFilterSave} /> : null}
    </div>
  );
}

function ImportView(props) {
  const context = useContext(DataContext);
  const [urlParams, setUrlParams] = useSearchParams();
  const urlSrc = urlParams.get("src");
  const clearData = () => {
    context.setDataAndFilter([], null);
    context.setColumns([]);
    context.setActive(null);
    context.setSymbology(null);
  }
  const setDataFromJson = (json) => {
    const flattened = getFeatures(json);
    if (flattened.length) {
      if (context.data.length === 0) {
        if (json.geotabMetadata) {
          context.setDataAndFilter(flattened, json.geotabMetadata.filter);
          context.setColumns(json.geotabMetadata.columns);
          context.setSymbology(json.geotabMetadata.symbology);
          setUrlParams({});
        } else {
          context.setData(context.data.concat(flattened));
          context.setColumns(getPropertiesUnion(flattened));
          setUrlParams({});
        }
      } else {
        const newData = context.data.concat(flattened);
        context.setData(newData);
        context.setColumns(getPropertiesUnion(newData));
        setUrlParams({});
      }
      context.setActive(null);
    }
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
        setDataFromJson(jsons.length > 1 ? { type: "FeatureCollection", features: jsons } : jsons[0]);
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
  if (urlSrc && (!context.data || !context.data.length)) {
    processServerFiles(urlSrc.split(','));
  }
  return (
    <div id="importView">
      <button type="button" id="next-button" onClick={clearData}>Clear Data</button>
      <h3>Import</h3>
      <FileImporter onRead={setDataFromJson} />
      <GoogleLogin onRead={setDataFromJson} />
      <p>Try pre-loaded data:</p>
      <ul>
        <li>
          <button onClick={() => { setUrlParams({src: "seattle-hills"}); processServerFile("json/seattle-hills.json"); }}>
            Seattle Hills
          </button>
        </li>
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

function FileImporter({onRead}) {
  const setProgress = (p) => {
    const fileProgress = document.getElementById('file-progress');
    fileProgress.innerHTML = `${Math.round(p)}%`;
  }
  const process = () => {
    setProgress(0);
    const fileSelector = document.getElementById('file-selector');
    const promises = [];
    for (let i = 0; i < fileSelector.files.length; i++) {
      promises.push(parseFile(fileSelector.files.item(i)));
    }
    attachProgress(promises, (p) => { setProgress(p); })
    Promise.allSettled(promises)
    .then((results) => {
      const jsons = results.filter((r) => r.status === "fulfilled").map((r) => r.value);
      const features = jsons.filter((j) => j !== null);
      const json = features.length > 1 ? { type: "FeatureCollection", features } : features[0];
      onRead(json);
      const errors = results.filter((r) => r.status === "rejected").map((r) => r.reason);
      errors.length && alert(errors);
    })
    .catch((e) => {
      alert(e);
    })
    ;
  };
  return (
    <div className="fileImporter">
      <input type="file" id="file-selector" multiple />
      <button type="button" id="next-button" onClick={process}>Process</button>
      <span style={{paddingLeft: 10}} id="file-progress"></span>
    </div>
  );
}

function ExportView(props) {
  const context = useContext(DataContext);
  const exportJson = (includeHidden) => {
    const downloadLink = document.createElement("a");
    const textContent = JSON.stringify({
      type: "FeatureCollection",
      // TODO option to save filtered or unfiltered data
      features: includeHidden ? context.data : context.filteredData,
      geotabMetadata: {
        columns: context.columns,
        filter: context.filter,
        symbology: context.symbology
      }
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
      <button onClick={() => exportJson(true)}>Export All</button>
      <button onClick={() => exportJson(false)}>Export Filtered</button>
    </div>
  );
}

function FilterDefinition(props) {
  const context = useContext(DataContext);
  const [draft, setDraft] = useState(props.filter ?? defaultFilter);
  const saveDraft = () => { props.onSave(draft); };
  const updateDraft = (newDraft) => { setDraft(newDraft); };
  return (
    <div id="filter-definition">
      <h3>Filter</h3>
      {props.filter && <p>{context.filteredData.length} of {context.data.length} rows.</p>}
      <FilterView filter={props.filter ?? defaultFilter} indent={0} indexInGroup={0} onEdit={updateDraft} />
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
  const onChildRemove = (indexInGroup) => {
    const newConditions = conditions.filter((condition, idx) => idx !== indexInGroup);
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
        options={Object.values(ConditionGroupOperator)}
        />
      {props.indent ? <MinusSquare className="removeButton" onClick={() => {props.removeCondition(props.filter)}} /> : null}
      {conditions.map((condition, idx) => <FilterView filter={condition} indent={props.indent+1} indexInGroup={idx} onEdit={onChildEdit} removeCondition={onChildRemove} key={`condition-group-${props.indent}-child-${idx}`} />)}
      <PlusSquare className="addButton" onClick={() => { setChildSelectorVisible(true); }} />
      {childSelectorVisible
      ? <div id={`condition-group-child-selector-${props.indent}`}>
        {Object.values(FilterType).map((ftype) => <button type="button" key={`condition-group-child-selector-${props.indent}-${ftype}`} onClick={(event) => { setChildSelectorVisible(false); onChildAdd(event.target.value); }} value={ftype}>{ftype}</button>)}
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
    const newOperandType = operandTypes[operator] === FieldType.Any ? column.type : operandTypes[operator];
    setFieldname(event.target.value);
    setOperandType(newOperandType);
    props.onEdit({type: "Condition", fieldname: event.target.value, operandType: newOperandType, operator, parameters, negate}, props.indexInGroup);
  };
  const onOperatorEdit = (event) => {
    const column = context.columns.find((column) => column.name === fieldname);
    if (column === undefined) { throw Error(`Cannot find column with name ${event.target.value}.`) }
    const newOperandType = operandTypes[event.target.value] === FieldType.Any ? column.type : operandTypes[event.target.value];
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
      <LabeledCheckbox
        checked={negate}
        onChange={onNegateEdit}
        label="NOT"
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
        options={Object.values(ConditionOperator)}
      />

      {Object.keys(parameters).map((param) =>
        <input id={`${props.key}-${param}`}
               name={param}
               defaultValue={parameters[param]}
               onChange={onParameterEdit}
               key={`${props.key}-${param}`}/>
      )}
      {props.indent ? <MinusSquare className="removeButton" onClick={() => {props.removeCondition(props.indexInGroup)}} /> : null}
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