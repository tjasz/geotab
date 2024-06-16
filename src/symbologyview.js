import React, { useContext, useState } from "react";
import { Slider } from "@mui/material";
import { DataContext } from "./dataContext";
import ColoredText from "./symbology/ColoredText";
import { SvgSelect } from "./SvgSelectorDialog"
import { options as svgPatternOptions } from "./PatternRenderer/options"
import { SymbologyPropertyView } from "./symbology/SymbologyPropertyView"

function SymbologyView(props) {
  const context = useContext(DataContext);
  const onSave = (draft) => {
    context.setSymbology(draft);
  };
  return (
    <div id="symbologyview" style={props.style}>
      <h2 onContextMenu={() => console.log(context.symbology)}>Symbology</h2>
      <SymbologyDefinition symbology={context.symbology} onSave={onSave} />
    </div>
  );
}

function SymbologyDefinition({ symbology, onSave }) {
  const [draft, setDraft] = useState(symbology);
  const saveDraft = () => {
    onSave(draft);
  };
  const updateDraft = (newDraft) => {
    setDraft(newDraft);
  };
  return (
    <div id="symbology-definition">
      <NumericSymbologyProperty
        name="hue"
        definition={draft?.hue}
        onEdit={(hueDef) => {
          updateDraft({ ...draft, hue: hueDef });
        }}
        minValue={0}
        maxValue={360}
        valueLabelFormat={(value) => (
          <ColoredText color={`hsla(${value}, 100%, 80%, 1)`}>
            {value}
          </ColoredText>
        )}
      />
      <NumericSymbologyProperty
        name="saturation"
        definition={draft?.saturation}
        onEdit={(saturationDef) => {
          updateDraft({ ...draft, saturation: saturationDef });
        }}
        minValue={0}
        maxValue={100}
        valueLabelFormat={(value) => (
          <ColoredText color={`hsla(0, ${value}%, 80%, 1)`}>
            {value}
          </ColoredText>
        )}
      />
      <NumericSymbologyProperty
        name="lightness"
        definition={draft?.lightness}
        onEdit={(lightnessDef) => {
          updateDraft({ ...draft, lightness: lightnessDef });
        }}
        minValue={0}
        maxValue={100}
        valueLabelFormat={(value) => (
          <ColoredText color={`hsla(0, 0%, ${value}%, 1)`}>{value}</ColoredText>
        )}
      />
      <NumericSymbologyProperty
        name="opacity"
        definition={draft?.opacity}
        onEdit={(opacityDef) => {
          updateDraft({ ...draft, opacity: opacityDef });
        }}
        minValue={0}
        maxValue={1}
        valueLabelFormat={(value) => (
          <ColoredText color={`hsla(0, 0%, 0%, ${value})`}>{value}</ColoredText>
        )}
      />
      <NumericSymbologyProperty
        name="size"
        definition={draft?.size}
        onEdit={(sizeDef) => {
          updateDraft({ ...draft, size: sizeDef });
        }}
        minValue={1}
        maxValue={20}
      />
      <NumericSymbologyProperty
        name="shape"
        definition={draft?.shape}
        onEdit={(shapeDef) => {
          updateDraft({ ...draft, shape: shapeDef });
        }}
        minValue={3}
        maxValue={20}
      />
      <SymbologyPropertyView
        name="line pattern"
        definition={draft?.linePattern}
        onEdit={(linePatternDef) => {
          updateDraft({ ...draft, linePattern: linePatternDef });
        }}
        placeholderValue={svgPatternOptions.Basic[0].pattern}
        onRenderSelector={(value, onChange, key) => {
          return <SvgSelect
            key={key}
            value={value}
            onChange={onChange}
            options={svgPatternOptions}
          />
        }}
      />
      <button
        id="save-symbology-draft"
        onClick={saveDraft}
        onContextMenu={() => console.log(draft)}
      >
        Save
      </button>
    </div>
  );
}

function NumericSymbologyProperty({
  name,
  definition,
  onEdit,
  minValue,
  maxValue,
  valueStep,
  valueLabelFormat,
}) {
  return <SymbologyPropertyView
    name={name}
    definition={definition}
    allowContinuous
    onEdit={onEdit}
    placeholderValue={minValue}
    onRenderSelector={(value, onChange, key) => {
      return <Slider
        key={key}
        value={value}
        onChange={(event, value) => onChange(value)}
        min={minValue}
        max={maxValue}
        step={
          valueStep ??
          Math.pow(10, Math.round(Math.log10((maxValue - minValue) / 20)))
        }
        valueLabelDisplay="on"
        valueLabelFormat={valueLabelFormat}
        track={false}
        marks
      />
    }}
  />
}

export default SymbologyView;
