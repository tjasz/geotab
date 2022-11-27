import React, {useContext, useState} from 'react';
import {Slider} from '@mui/material'
import {DataContext} from './dataContext.js'
import {Select, ColoredText} from './common-components.js'
import {symbologyModes} from './painter.js'
import {ReactComponent as MinusSquare} from './feather/minus-square.svg'
import {ReactComponent as PlusSquare} from './feather/plus-square.svg'

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
  const saveDraft = () => { console.log(draft); onSave(draft); };
  const updateDraft = (newDraft) => { setDraft(newDraft); };
  return (
    <div id="symbology-definition">
      <SymbologyProperty name="hue" definition={draft?.hue}
        onEdit={(hueDef) => {updateDraft({...draft, hue: hueDef})}}
        minValue={0} maxValue={360}
        minBreak={0} maxBreak={15000}
        valueLabelFormat={(value) => <ColoredText color={`hsla(${value}, 100%, 80%, 1)`} text={value} />}
        />
      <SymbologyProperty name="saturation" definition={draft?.saturation}
        onEdit={(saturationDef) => {updateDraft({...draft, saturation: saturationDef})}}
        minValue={0} maxValue={100}
        minBreak={0} maxBreak={15000}
        valueLabelFormat={(value) => <ColoredText color={`hsla(0, ${value}%, 80%, 1)`} text={value} />}
        />
      <button id="save-symbology-draft" onClick={saveDraft}>Save</button>
    </div>
  );
}

function SymbologyProperty({name, definition, onEdit, minValue, maxValue, minBreak, maxBreak, valueLabelFormat}) {
  const context = useContext(DataContext);
  const [fieldname, setFieldname] = useState(definition?.fieldname ?? context.columns[0].name);
  const [mode, setMode] = useState(definition?.mode ?? "discrete");
  const [values, setValues] = useState(definition?.values ?? [minValue]);
  const [breaks, setBreaks] = useState(definition?.breaks ?? []);

  const onFieldnameEdit = (event) => {
    setFieldname(event.target.value);
    onEdit({mode, values, fieldname: event.target.value, breaks});
  };
  const onModeEdit = (event) => {
    const newMode = event.target.value;
    let newBreaks = breaks;
    let newValues = values;
    if (newMode === "continuous") {
      // must have at least two values
      if (values.length < 2) {
        newValues = [...values, ...Array(2-values.length).fill(minValue)];
      }
      // 'breaks' should have the same number of values as 'values'
      if (breaks.length < newValues.length) {
        newBreaks = [...breaks, ...Array(newValues.length-breaks.length).fill(minBreak)];
      }
    } else { // discrete
      // 'breaks' should have one less value than 'values'
      newBreaks = breaks.slice(0, values.length-1)
    }
    setMode(newMode);
    setValues(newValues);
    setBreaks(newBreaks);
    onEdit({mode: newMode, values: newValues, fieldname, breaks: newBreaks});
  };
  const onValuesEdit = (value, idx) => {
    const newValues = values.map((v, i) => i === idx ? value : v);
    setValues(newValues);
    onEdit({mode, values: newValues, fieldname, breaks});
  }
  const onValueAdd = (event) => {
    setValues(Array.isArray(values) ? [...values, 0] : [values, 0]);
    setBreaks(Array.isArray(breaks) ? [...breaks, 0] : [breaks, 0]);
    onEdit({mode, values: Array.isArray(values) ? [...values, minValue] : [values, minValue], fieldname,
            breaks: Array.isArray(breaks) ? [...breaks, minBreak] : [breaks, minBreak]});
  };
  const onValueRemove = (event) => {
    setValues(Array.isArray(values) ? values.slice(0, values.length-1) : []);
    setBreaks(Array.isArray(breaks) ? breaks.slice(0, breaks.length-1) : []);
    onEdit({mode, values: Array.isArray(values) ? values.slice(0, values.length-1) : [], fieldname,
            breaks: Array.isArray(breaks) ? breaks.slice(0, breaks.length-1) : []});
  };
  const onBreaksEdit = (event, breaks) => {
    setBreaks(Array.isArray(breaks) ? breaks : [breaks]);
    onEdit({mode, values, fieldname, breaks: Array.isArray(breaks) ? breaks : [breaks]});
  }

  // TODO disable continuous for string columns
  return (
    <div className="symbologyProperty">
      <h3>{name}</h3>
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
        onChange={onModeEdit}
        options={symbologyModes}
        />
      <h4>Values</h4>
      {values.map((value, idx) =>
        <Slider
          key={idx}
          min={minValue}
          max={maxValue}
          value={value}
          onChangeCommitted={(event, value) => { onValuesEdit(value, idx) }}
          valueLabelDisplay="on"
          valueLabelFormat={valueLabelFormat}
          track={false}
          />)}
      <MinusSquare className="removeSymbologyValue" onClick={onValueRemove} />
      <PlusSquare className="addSymbologyValue" onClick={onValueAdd} />
      <h4>Breaks</h4>
      <Slider
        min={minBreak}
        max={maxBreak}
        value={breaks}
        onChangeCommitted={onBreaksEdit}
        valueLabelDisplay="on"
        track={false}
        />
    </div>
  );
}

export default SymbologyView;