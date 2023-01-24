import React, {useContext, useState} from 'react';
import {Slider} from '@mui/material'
import {DataContext} from './dataContext'
import {Select, ColoredText, MultiTextField, Histogram} from './common-components.js'
import {symbologyModes, modesForType} from './painter.js'
import {toType} from './algorithm'
import {ReactComponent as MinusSquare} from './feather/minus-square.svg'
import {ReactComponent as PlusSquare} from './feather/plus-square.svg'
import { LabeledCheckbox } from './LabeledCheckbox.js';

function SymbologyView(props) {
  const context = useContext(DataContext);
  const onSave = (draft) => {context.setSymbology(draft);};
  return (
    <div id="symbologyview" style={props.style}>
      <h2>Symbology</h2>
      <SymbologyDefinition symbology={context.symbology} onSave={onSave} />
    </div>
  );
}

function SymbologyDefinition({symbology, onSave}) {
  const [draft, setDraft] = useState(symbology);
  const saveDraft = () => { onSave(draft); };
  const updateDraft = (newDraft) => { setDraft(newDraft); };
  return (
    <div id="symbology-definition">
      <SymbologyProperty name="hue" definition={draft?.hue}
        onEdit={(hueDef) => {updateDraft({...draft, hue: hueDef})}}
        minValue={0} maxValue={360}
        valueLabelFormat={(value) => <ColoredText color={`hsla(${value}, 100%, 80%, 1)`} text={value} />}
        />
      <SymbologyProperty name="saturation" definition={draft?.saturation}
        onEdit={(saturationDef) => {updateDraft({...draft, saturation: saturationDef})}}
        minValue={0} maxValue={100}
        valueLabelFormat={(value) => <ColoredText color={`hsla(0, ${value}%, 80%, 1)`} text={value} />}
        />
      <SymbologyProperty name="lightness" definition={draft?.lightness}
        onEdit={(lightnessDef) => {updateDraft({...draft, lightness: lightnessDef})}}
        minValue={0} maxValue={100}
        valueLabelFormat={(value) => <ColoredText color={`hsla(0, 0%, ${value}%, 1)`} text={value} />}
        />
      <SymbologyProperty name="opacity" definition={draft?.opacity}
        onEdit={(opacityDef) => {updateDraft({...draft, opacity: opacityDef})}}
        minValue={0} maxValue={1}
        valueLabelFormat={(value) => <ColoredText color={`hsla(0, 0%, 0%, ${value})`} text={value} />}
        />
      <SymbologyProperty name="size" definition={draft?.size}
        onEdit={(sizeDef) => {updateDraft({...draft, size: sizeDef})}}
        minValue={1} maxValue={20}
        />
      <SymbologyProperty name="shape" definition={draft?.shape}
        onEdit={(shapeDef) => {updateDraft({...draft, shape: shapeDef})}}
        minValue={3} maxValue={20}
        />
      <button id="save-symbology-draft" onClick={saveDraft}>Save</button>
    </div>
  );
}

function SymbologyProperty({name, definition, onEdit, minValue, maxValue, valueStep, valueLabelFormat}) {
  const context = useContext(DataContext);
  const [fieldname, setFieldname] = useState(definition?.fieldname ?? context.columns[0]?.name);
  const [mode, setMode] = useState(definition?.mode ?? "discrete");
  const [values, setValues] = useState(definition?.values ?? [minValue]);
  const [breaks, setBreaks] = useState(definition?.breaks ?? []);
  const [defaultValue, setDefault] = useState(definition?.default ?? minValue);
  const [type, setType] = useState(context.columns.find((c) => c.name === fieldname)?.type);

  let minBreak = 0;
  let maxBreak = 100;
  let breakStep = 10;
  if (context.columns.find((column) => column.name === fieldname)) {
    const column = context.columns.find((column) => column.name === fieldname);
    const columnData = context.filteredData.map((f) => f.properties[column.name]).filter(d => d);
    var columnMin = Math.min(...columnData);
    var columnMax = Math.max(...columnData);
    // gracefully handle case where the column has only one non-null value
    if (columnMin === columnMax) {
      if (columnMax > 0) {
        columnMin = 0;
      } else {
        columnMax = 0;
      }
    }
    if (column.type === "date") {
      if (typeof columnMin === "string") {
        // get power of 10 that splits the range into roughly 20 - TODO make more date-friendly breaks
        breakStep = Math.pow(10, Math.round(Math.log10((Date.parse(columnMax)-Date.parse(columnMin))/20)));
        minBreak = breakStep*Math.floor(Date.parse(columnMin)/breakStep);
        maxBreak = breakStep*Math.ceil(Date.parse(columnMax)/breakStep);
      } else if (typeof columnMin === "number") {
        // get power of 10 that splits the range into roughly 20 - TODO make more date-friendly breaks
        breakStep = Math.pow(10, Math.round(Math.log10((columnMax-columnMin)/20)));
        minBreak = breakStep*Math.floor(columnMin/breakStep);
        maxBreak = breakStep*Math.ceil(columnMax/breakStep);
      } else if (columnMin instanceof Date) {
        // get power of 10 that splits the range into roughly 20 - TODO make more date-friendly breaks
        breakStep = Math.pow(10, Math.round(Math.log10((columnMax.getTime()-columnMin.getTime())/20)));
        minBreak = breakStep*Math.floor(columnMin.getTime()/breakStep);
        maxBreak = breakStep*Math.ceil(columnMax.getTime()/breakStep);
      }
    } else {
      // get power of 10 that splits the range into roughly 20
      breakStep = Math.pow(10, Math.round(Math.log10((columnMax-columnMin)/20)));
      minBreak = breakStep*Math.floor(columnMin/breakStep);
      maxBreak = breakStep*Math.ceil(columnMax/breakStep);
    }
  }

  const onCheckboxChange = (event) => {
    onEdit(event.target.checked ? {mode, values, fieldname, type, breaks, default: defaultValue} : undefined);
  };
  const onFieldnameEdit = (event) => {
    const newFieldname = event.target.value;
    const newType = context.columns.find((c) => c.name === newFieldname).type;
    const modeOptions = modesForType(newType).map(m => m.name);
    const newMode = modeOptions.includes(mode) ? mode : modeOptions[0];
    setFieldname(newFieldname);
    setType(newType);
    if (newMode !== mode) {
      onModeEdit({target: {value: newMode}});
      setMode(newMode);
    }
    onEdit({mode: newMode, values, fieldname: newFieldname, type: newType, breaks, default: defaultValue});
  };
  const onModeEdit = (event) => {
    const newMode = event.target.value;
    let newBreaks = breaks;
    let newValues = values;

    // ensure minimum values for the symbology mode is met
    const modeDefinition = symbologyModes[newMode];
    if (values.length < modeDefinition.minimumValues) {
      newValues = [...values, ...Array(modeDefinition.minimumValues - values.length).fill(minValue)];
    }
    // ensure correct number of breaks for the symbology mode is met
    const numBreaks = modeDefinition.numBreaks(newValues.length);
    if (breaks.length < newValues.length) {
      newBreaks = [...breaks, ...Array(numBreaks - breaks.length).fill(minBreak)];
    } else {
      newBreaks = breaks.slice(0, numBreaks);
    }

    setMode(newMode);
    setValues(newValues);
    setBreaks(newBreaks);
    onEdit({mode: newMode, values: newValues, fieldname, type, breaks: newBreaks, default: defaultValue});
  };
  const onDefaultEdit = (newDefault) => {
    setDefault(newDefault);
    onEdit({mode, values, fieldname, type, breaks, default: defaultValue});
  }
  const onValuesEdit = (value, idx) => {
    const newValues = values.map((v, i) => i === idx ? value : v);
    setValues(newValues);
    onEdit({mode, values: newValues, fieldname, type, breaks, default: defaultValue});
  }
  const onValueAdd = (event) => {
    setValues(Array.isArray(values) ? [...values, minValue] : [values, minValue]);
    setBreaks(Array.isArray(breaks) ? [...breaks, minBreak] : [breaks, minBreak]);
    onEdit({mode, values: Array.isArray(values) ? [...values, minValue] : [values, minValue], fieldname, type,
            breaks: Array.isArray(breaks) ? [...breaks, minBreak] : [breaks, minBreak], default: defaultValue});
  };
  const onValueRemove = (event) => {
    if (!Array.isArray(values) || values.length <= symbologyModes[mode].minimumValues) {
      return;
    }
    setValues(values.slice(0, values.length-1));
    setBreaks(Array.isArray(breaks) ? breaks.slice(0, breaks.length-1) : []);
    onEdit({mode, values: values.slice(0, values.length-1), fieldname, type,
            breaks: Array.isArray(breaks) ? breaks.slice(0, breaks.length-1) : [], default: defaultValue});
  };
  const onBreaksEdit = (event, breaks) => {
    const newBreaks = (Array.isArray(breaks) ? breaks : [breaks]).map(b => toType(b, type));
    setBreaks(newBreaks);
    onEdit({mode, values, fieldname, type, breaks: newBreaks, default: defaultValue});
  }

  return (
    <div className="symbologyProperty">
      <h3>
        <LabeledCheckbox
          checked={definition ? true : false}
          onChange={onCheckboxChange}
          label={name.toUpperCase()}
          />
      </h3>
      {definition ? <div style={{paddingLeft: "1em"}}>
        <Select
          id={`symbology-${name}-fieldname`}
          name={`symbology-${name}-fieldname`}
          defaultValue={fieldname}
          onChange={onFieldnameEdit}
          options={context.columns.map((column) => column.name)}
          />
        <Select
          id={`symbology-${name}-mode`}
          name={`symbology-${name}-mode`}
          defaultValue={mode}
          value={mode}
          onChange={onModeEdit}
          options={modesForType(context.columns.find((column) => column.name === fieldname)?.type).map(m => m.name)}
          />
        <h4>Default Value</h4>
        <p>Used for <em>null</em>, <em>undefined</em> field values.</p>
        <Slider
          min={minValue}
          max={maxValue}
          step={valueStep ?? Math.pow(10, Math.round(Math.log10((maxValue-minValue)/20)))}
          value={defaultValue}
          onChange={(event, defaultValue) => { onDefaultEdit(defaultValue) }}
          valueLabelDisplay="on"
          valueLabelFormat={valueLabelFormat}
          track={false}
          marks
          />
        <h4>Values</h4>
        <div style={{width: "calc(100% - 2em)"}}>
          {values.map((value, idx) =>
            <Slider
              key={idx}
              min={minValue}
              max={maxValue}
              step={valueStep ?? Math.pow(10, Math.round(Math.log10((maxValue-minValue)/20)))}
              value={value}
              onChange={(event, value) => { onValuesEdit(value, idx) }}
              valueLabelDisplay="on"
              valueLabelFormat={valueLabelFormat}
              track={false}
              marks
              />)}
        </div>
        <MinusSquare className={`removeButton${values.length > symbologyModes[mode].minimumValues ? "" : "Disabled"}`} onClick={onValueRemove} />
        <PlusSquare className="addButton" onClick={onValueAdd} />
        <h4>Breaks</h4>
        {context.columns.find((column) => column.name === fieldname)?.type === "string" || mode === "byvalue"
         ? <MultiTextField values={breaks} onChange={onBreaksEdit} />
         : <div style={{width: "calc(100% - 2em)"}}>
            <Slider
              min={minBreak}
              max={maxBreak}
              step={breakStep}
              value={breaks}
              onChange={onBreaksEdit}
              valueLabelDisplay="on"
              valueLabelFormat={(v) => JSON.stringify(toType(v, type))}
              track={false}
              marks
              />
            <Histogram viewboxHeight={10}
              left={minBreak} right={maxBreak}
              binWidth={breakStep}
              values={context.filteredData.map((feature) => {
                const col = context.columns.find((column) => column.name === fieldname);
                if (!col) return null;
                return toType(feature.properties[col.name], col.type);
              })}
              />
           </div>
        }
      </div> : null}
    </div>
  );
}

export default SymbologyView;