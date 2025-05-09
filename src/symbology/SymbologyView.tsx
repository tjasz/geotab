import { useState } from "react";
import ColoredText from "./ColoredText";
import { SvgPathPreview, SvgPatternPreview, SvgSelect } from "./SvgSelectorDialog"
import { linePatternOptions } from "./linePatternOptions"
import { SymbologyPropertyView } from "./SymbologyPropertyView"
import { NumericSymbologyPropertyView } from "./NumericSymbologyPropertyView"
import { markersLibrary } from "./iconlib";
import React from "react";
import { Symbology } from "./painter";

interface SymbologyDefinitionProps {
  symbology?: Symbology | null;
  onSave: (draft: Symbology) => void;
}

const SymbologyDefinition: React.FC<SymbologyDefinitionProps> = ({ symbology, onSave }) => {
  const [draft, setDraft] = useState(symbology ?? {});

  if (!symbology) {
    return <p>No symbology defined.</p>;
  }

  const saveDraft = () => {
    onSave(draft);
  };
  const updateDraft = (newDraft) => {
    setDraft(newDraft);
  };

  return (
    <div id="symbology-definition">
      <NumericSymbologyPropertyView
        name="hue"
        definition={draft?.hue}
        onEdit={(hueDef) => {
          updateDraft({ ...draft, hue: hueDef });
        }}
        minValue={0}
        maxValue={360}
        valueLabelFormat={(value) => (
          <ColoredText color={`hsla(${value}, 100%, 80%, 1)`}>
            {value.toString()}
          </ColoredText>
        )}
      />
      <NumericSymbologyPropertyView
        name="saturation"
        definition={draft?.saturation}
        onEdit={(saturationDef) => {
          updateDraft({ ...draft, saturation: saturationDef });
        }}
        minValue={0}
        maxValue={100}
        valueLabelFormat={(value) => (
          <ColoredText color={`hsla(0, ${value}%, 80%, 1)`}>
            {value.toString()}
          </ColoredText>
        )}
      />
      <NumericSymbologyPropertyView
        name="lightness"
        definition={draft?.lightness}
        onEdit={(lightnessDef) => {
          updateDraft({ ...draft, lightness: lightnessDef });
        }}
        minValue={0}
        maxValue={100}
        valueLabelFormat={(value) => (
          <ColoredText color={`hsla(0, 0%, ${value}%, 1)`}>{value.toString()}</ColoredText>
        )}
      />
      <NumericSymbologyPropertyView
        name="opacity"
        definition={draft?.opacity}
        onEdit={(opacityDef) => {
          updateDraft({ ...draft, opacity: opacityDef });
        }}
        minValue={0}
        maxValue={1}
        valueLabelFormat={(value) => (
          <ColoredText color={`hsla(0, 0%, 0%, ${value})`}>{value.toString()}</ColoredText>
        )}
      />
      <NumericSymbologyPropertyView
        name="size"
        definition={draft?.size}
        onEdit={(sizeDef) => {
          updateDraft({ ...draft, size: sizeDef });
        }}
        minValue={1}
        maxValue={20}
      />
      <NumericSymbologyPropertyView
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
        placeholderValue={linePatternOptions.Basic[0]}
        onRenderSelector={(value, onChange, key) => {
          return <SvgSelect
            key={key}
            value={value}
            onChange={option => onChange(option)}
            options={linePatternOptions}
            onOptionRender={(option, onClick, style) => {
              return <SvgPatternPreview
                width={100}
                height={30}
                pattern={option.pattern}
                onClick={onClick}
                style={style}
              />
            }}
          />
        }}
      />
      <SymbologyPropertyView
        name="marker symbol"
        definition={draft?.markerSymbol}
        onEdit={(markerSymbolDef) => {
          updateDraft({ ...draft, markerSymbol: markerSymbolDef });
        }}
        placeholderValue={markersLibrary.Points[0]}
        onRenderSelector={(value, onChange, key) => {
          return <SvgSelect
            key={key}
            value={value}
            onChange={option => onChange(option)}
            options={markersLibrary}
            onOptionRender={(option, onClick, style) => {
              if (!option.pattern) {
                console.error(option)
              }
              return <SvgPathPreview
                width={30}
                height={30}
                viewBox="0 0 15 15"
                path={option.pattern.replaceAll("&#xA;&#x9;", "")}
                onClick={onClick}
                style={style}
                strokeWidth={0}
                fill="black"
              />
            }}
          />
        }}
      />
    </div>
  );
}

export default SymbologyDefinition;
