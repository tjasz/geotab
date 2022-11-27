import React, {useContext, useState} from 'react';
import {Slider} from '@mui/material'
import {DataContext} from './dataContext.js'
import {Select, ColoredText} from './common-components.js'
import {symbologyModes} from './painter.js'

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
        onEdit={(hueDef) => {updateDraft({...draft, hue: hueDef})}} />
      <button id="save-symbology-draft" onClick={saveDraft}>Save</button>
    </div>
  );
}

function SymbologyProperty({name, definition, onEdit}) {
  const context = useContext(DataContext);
  const [fieldname, setFieldname] = useState(definition?.fieldname ?? context.columns[0].name);
  const [mode, setMode] = useState(definition?.mode ?? "discrete");
  const [values, setValues] = useState(definition?.values ?? [209]);
  const [breaks, setBreaks] = useState(definition?.breaks ?? []);

  const onFieldnameEdit = (event) => {
    setFieldname(event.target.value);
    onEdit({mode, values, fieldname: event.target.value, breaks});
  };
  const onModeEdit = (event) => {
    setMode(event.target.value);
    onEdit({mode: event.target.value, values, fieldname, breaks});
  };
  const onValuesEdit = (event, values) => {
    setValues(Array.isArray(values) ? values : [values]);
    onEdit({mode, values: Array.isArray(values) ? values : [values], fieldname, breaks});
  }

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
      <Slider
        min={0}
        max={360}
        defaultValue={values}
        onChangeCommitted={onValuesEdit}
        valueLabelDisplay="on"
        valueLabelFormat={(value) => <ColoredText color={`hsla(${value}, 100%, 80%, 1)`} text={value} />}
        track={false}
        />
    </div>
  );
}

export default SymbologyView;