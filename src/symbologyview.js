import React, { useContext, useState } from "react";
import { Slider } from "@mui/material";
import { DataContext } from "./dataContext";
import { Select, Histogram } from "./common-components";
import ColoredText from "./symbology/ColoredText";
import MultiTextField from "./symbology/MultiTextField";
import { symbologyModes, modesForType } from "./painter";
import { toType } from "./fieldtype";
import { ReactComponent as MinusSquare } from "./feather/minus-square.svg";
import { ReactComponent as PlusSquare } from "./feather/plus-square.svg";
import { LabeledCheckbox } from "./LabeledCheckbox";
import { pointsToPatternPath } from "./PatternRenderer/SvgPatternRenderer"
import { SvgSelect } from "./SvgSelectorDialog"

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
      <NonNumericSymbologyProperty
        name="line pattern"
        definition={draft?.linePattern}
        onEdit={(linePatternDef) => {
          updateDraft({ ...draft, linePattern: linePatternDef });
        }}
        valueOptions={[
          "solid",
          "M0 0L0 2,,4,F", // dots
          "M0 0L0 4,,8,F", // dashes
          "M0 0L0 8,,12,F", // long dashes
          "M0 0L0 2,,10,F;M0 4L0 8,,10,F", // dash-dots
          "M4 0L4 2,,4,T", // solid with dots under
          "M4 0L4 4,,8,T", // solid with dashes under
          "M4 0L4 8,,12,T", // solid with long dashes under
          "M4 0L4 2,,10,T;M4 4L4 8,,10,T", // solid with dash-dots under
          "M-3 0L3 0,10,20,T", // vertical ticks
          "M-3 0L3 0M-3 4L3 4,10,20,T", // double vertical ticks
          "M-4 0L4 0,0,,T;M-4 0L4 0,100%,,T", // hash at start, hash at end
          // TODO below might be proprietary to CalTopo, I just want to see that they work
          "solid",
          "M-4 0L4 0,,8,T",
          "M0 -1 L0 1,,8,F",
          "M0 0L 6 0,,10,T",
          "M-6 0L6 0,,10,F",
          "M0 -3 L0 3,,12,F",
          "M-5 3L5 0M-5 -3L5 0,,6,F",
          "M-5 8 L0 -2 L5 8 Z,100%,,T",
          "M-4 -4L-4 4L4 4L4 -4Z,,25,T",
          "M-5 5L0 -5M5 5L0 -5,40,80,T",
          "M-5 5L0 -5M5 5L0 -5,20,40,T",
          "M0 -3 L0 3,0,16,F;M0 -1L0 0,8,16",
          "M-8 -6M8 6M-6 0L0 4L6 0L0 -4Z,,10,F",
          "M-6 0M6 0M-5 -5 L5 5 M5 -5 L-5 5,,10,F",
          "M-6 0M6 0M-5 -5 L5 5 M5 -5 L-5 5,,15,F",
          "M-6 0M6 0M-5 -5 L5 5 M5 -5 L-5 5,7,60,T",
          "M-6 8L0 -8M6 8L0 -8M0 0L-6 8M0 0L6 8,40,80,T",
          "M-6 8L0 -8M6 8L0 -8M0 0L-6 8M0 0L6 8,20,40,T",
          "M-6 14L0 -2M6 14L0 -2M0 6L-6 14M0 6L6 14,100%,,T",
          "M5 5M-5 -5M3 0A3 3 0 1 0 -3 0 A3 3 0 1 0 3 0,,15,F",
          "M4 4M-4 -4M2 0A2 2 0 1 0 -2 0 A2 2 0 1 0 2 0,,15,F",
          "M4 4M-4 -4M2 0A2 2 0 1 0 -2 0 A2 2 0 1 0 2 0,,10,F",
          "M6 6M-6 -6M-5 0L0 5 M5 0L0 5M-5 0L0 -5M5 0L0 -5,,12,F",
          "M5 6L-5 3M5 0L-5 3M5 0L-5 -2M-5 -5L-5 -2M5 -6L-5 -6,,14,F",
          "M12 -7M0 5M9 0A3 3 0 1 0 6 0 A3 3 0 0 0 9 0,2,20,T;M0 0L12 0,15,20",
          "M0 -3 L0 3,,12,F;M4 4M-4 -4M2 0A2 2 0 1 0 -2 0 A2 2 0 1 0 2 0,5,36,F",
          "M-7 0M7 0M-6 0L-2 -4M-6 0L-2 4M2 0L-2 -4M2 0L-2 4M2 0L6 -4M2 0L6 4,,8,F",
          "M-6 5L-4 2M0 0L-4 2M0 0L4 2M6 5L4 2 M-6 -5L-4 -2M0 0L-4 -2M0 0L4 -2M6 -5L4 -2,,16,F",
          "M4 4M-4 -4M2 0A2 2 0 1 0 -2 0 A2 2 0 1 0 2 0,,20,F;M0 5L7 7M-7 13L7 7M-7 13L0 15,0,20",
          "M4 4M-4 -4M2 0A2 2 0 1 0 -2 0 A2 2 0 1 0 2 0,,15,F;M-6 0M6 0M-5 -5 L5 5 M5 -5 L-5 5,7,45,F",
          "M4 4M-4 -4M2 0A2 2 0 1 0 -2 0 A2 2 0 1 0 2 0,,20,F;M-8 6L-4 1M4 6L-4 1M4 6L8 1\tM-8 -1L-4 -6M4 -1L-4 -6M4 -1L8 -6,10,40",
          "M-8 -8M8 8M-7 0L7 0M-5 0L-4 2L-2 4L-1 4L0 6M5 0L4 2L2 4L1 4L0 6M-5 0L-4 -2L-2 -4L-1 -4L0 -6M5 0L4 -2L2 -4L1 -4L0 -6,,30,T",
          "M-12 -12 M12 12 M2 6A2 2 0 1 0 -2 6 A2 2 0 1 0 2 6\t M10 6A2 2 0 1 0 6 6 A2 2 0 0 0 10 6\tM-10 6A2 2 0 1 0 -6 6 A2 2 0 0 0 -10 6\tM6 0A2 2 0 1 0 2 0 A2 2 0 0 0 6 0 M-6 0A2 2 0 1 0 -2 0 A2 2 0 0 0 -6 0\tM2 -6A2 2 0 1 0 -2 -6 A2 2 0 1 0 2 -6,,25,F",
        ]}
        valueLabelFormat={(value) => {
          const path = pointsToPatternPath([[{ x: 0, y: 0 }, { x: 100, y: 0 }]], false, value);
          return <span style={{
            backgroundImage: `url( "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 20'%3E%3Cpath d='${path}'/%3E%3C/svg%3E" )`
          }}>
            {value}
          </span>
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

// TODO a lot if copied between this and NumericSymbologyProperty
// reuse components as possible
function NonNumericSymbologyProperty({
  name,
  definition,
  onEdit,
  valueOptions,
  valueLabelFormat, // TODO instead of valueLabelFormat, make the options selector a parameter so it can be Slider or SvgSelect
}) {
  const context = useContext(DataContext);
  const [fieldname, setFieldname] = useState(
    definition?.fieldname ?? context.columns[0]?.name,
  );
  const [mode, setMode] = useState(definition?.mode ?? "discrete");
  const [values, setValues] = useState(definition?.values ?? [valueOptions[0]]);
  const [breaks, setBreaks] = useState(definition?.breaks ?? []);
  const [defaultValue, setDefault] = useState(definition?.default ?? valueOptions[0]);
  const [type, setType] = useState(
    context.columns.find((c) => c.name === fieldname)?.type,
  );

  let minBreak = 0;
  let maxBreak = 100;
  let breakStep = 10;
  if (context.columns.find((column) => column.name === fieldname)) {
    const column = context.columns.find((column) => column.name === fieldname);
    const columnData = context.filteredData
      .map((f) => toType(f.properties[column.name], column.type))
      .filter((d) => d);
    if (columnData && columnData.length) {
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
          breakStep = Math.pow(
            10,
            Math.round(
              Math.log10((Date.parse(columnMax) - Date.parse(columnMin)) / 20),
            ),
          );
          minBreak = breakStep * Math.floor(Date.parse(columnMin) / breakStep);
          maxBreak = breakStep * Math.ceil(Date.parse(columnMax) / breakStep);
        } else if (typeof columnMin === "number") {
          // get power of 10 that splits the range into roughly 20 - TODO make more date-friendly breaks
          breakStep = Math.pow(
            10,
            Math.round(Math.log10((columnMax - columnMin) / 20)),
          );
          minBreak = breakStep * Math.floor(columnMin / breakStep);
          maxBreak = breakStep * Math.ceil(columnMax / breakStep);
        } else if (columnMin instanceof Date) {
          // get power of 10 that splits the range into roughly 20 - TODO make more date-friendly breaks
          breakStep = Math.pow(
            10,
            Math.round(
              Math.log10((columnMax.getTime() - columnMin.getTime()) / 20),
            ),
          );
          minBreak = breakStep * Math.floor(columnMin.getTime() / breakStep);
          maxBreak = breakStep * Math.ceil(columnMax.getTime() / breakStep);
        }
      } else {
        // get power of 10 that splits the range into roughly 20
        breakStep = Math.pow(
          10,
          Math.round(Math.log10((columnMax - columnMin) / 20)),
        );
        minBreak = breakStep * Math.floor(columnMin / breakStep);
        maxBreak = breakStep * Math.ceil(columnMax / breakStep);
      }
    }
  }

  const onCheckboxChange = (event) => {
    onEdit(
      event.target.checked
        ? { mode, values, fieldname, type, breaks, default: defaultValue }
        : undefined,
    );
  };
  const onFieldnameEdit = (event) => {
    const newFieldname = event.target.value;
    const newType = context.columns.find((c) => c.name === newFieldname).type;
    const modeOptions = modesForType(newType).map((m) => m.name).filter(m => m !== "continous");
    const newMode = modeOptions.includes(mode) ? mode : modeOptions[0];
    setFieldname(newFieldname);
    setType(newType);
    if (newMode !== mode) {
      onModeEdit({ target: { value: newMode } });
      setMode(newMode);
    }
    onEdit({
      mode: newMode,
      values,
      fieldname: newFieldname,
      type: newType,
      breaks,
      default: defaultValue,
    });
  };
  const onModeEdit = (event) => {
    const newMode = event.target.value;
    let newBreaks = breaks;
    let newValues = values;

    // ensure minimum values for the symbology mode is met
    const modeDefinition = symbologyModes[newMode];
    if (values.length < modeDefinition.minimumValues) {
      newValues = [
        ...values,
        ...Array(modeDefinition.minimumValues - values.length).fill(valueOptions[0]),
      ];
    }
    // ensure correct number of breaks for the symbology mode is met
    const numBreaks = modeDefinition.numBreaks(newValues.length);
    if (breaks.length < newValues.length) {
      newBreaks = [
        ...breaks,
        ...Array(numBreaks - breaks.length).fill(minBreak),
      ];
    } else {
      newBreaks = breaks.slice(0, numBreaks);
    }

    setMode(newMode);
    setValues(newValues);
    setBreaks(newBreaks);
    onEdit({
      mode: newMode,
      values: newValues,
      fieldname,
      type,
      breaks: newBreaks,
      default: defaultValue,
    });
  };
  const onDefaultEdit = (newDefault) => {
    setDefault(newDefault);
    onEdit({ mode, values, fieldname, type, breaks, default: newDefault });
  };
  const onValuesEdit = (value, idx) => {
    const newValues = values.map((v, i) => (i === idx ? value : v));
    setValues(newValues);
    onEdit({
      mode,
      values: newValues,
      fieldname,
      type,
      breaks,
      default: defaultValue,
    });
  };
  const onValueAdd = (event) => {
    setValues(
      Array.isArray(values) ? [...values, valueOptions[0]] : [values, valueOptions[0]],
    );
    setBreaks(
      Array.isArray(breaks) ? [...breaks, minBreak] : [breaks, minBreak],
    );
    onEdit({
      mode,
      values: Array.isArray(values)
        ? [...values, valueOptions[0]]
        : [values, valueOptions[0]],
      fieldname,
      type,
      breaks: Array.isArray(breaks)
        ? [...breaks, minBreak]
        : [breaks, minBreak],
      default: defaultValue,
    });
  };
  const onValueRemove = (event) => {
    if (
      !Array.isArray(values) ||
      values.length <= symbologyModes[mode].minimumValues
    ) {
      return;
    }
    setValues(values.slice(0, values.length - 1));
    setBreaks(Array.isArray(breaks) ? breaks.slice(0, breaks.length - 1) : []);
    onEdit({
      mode,
      values: values.slice(0, values.length - 1),
      fieldname,
      type,
      breaks: Array.isArray(breaks) ? breaks.slice(0, breaks.length - 1) : [],
      default: defaultValue,
    });
  };
  const onBreaksEdit = (event, breaks) => {
    const newBreaks = (Array.isArray(breaks) ? breaks : [breaks]).map((b) =>
      toType(b, type),
    );
    setBreaks(newBreaks);
    onEdit({
      mode,
      values,
      fieldname,
      type,
      breaks: newBreaks,
      default: defaultValue,
    });
  };

  return (
    <div className="symbologyProperty">
      <h3 onContextMenu={() => console.log(definition)}>
        <LabeledCheckbox
          checked={definition ? true : false}
          onChange={onCheckboxChange}
          label={name.toUpperCase()}
        />
      </h3>
      {definition ? (
        <div style={{ paddingLeft: "1em" }}>
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
            options={modesForType(
              context.columns.find((column) => column.name === fieldname)?.type,
            ).map((m) => m.name).filter(m => m !== "continuous")}
          />
          <h4>Default Value</h4>
          <p>
            Used for <em>null</em>, <em>undefined</em> field values.
          </p>
          <SvgSelect
            value={defaultValue}
            options={valueOptions}
            onChange={(s) => onDefaultEdit(s)}
          />
          <h4>Values</h4>
          <div style={{ width: "calc(100% - 2em)" }}>
            {values.map((value, idx) => (
              <SvgSelect
                key={`symbology-${name}-value-${idx}`}
                value={value}
                options={valueOptions}
                onChange={(s) => onValuesEdit(s, idx)}
              />
            ))}
          </div>
          <MinusSquare
            className={`removeButton${values.length > symbologyModes[mode].minimumValues ? "" : "Disabled"}`}
            onClick={onValueRemove}
          />
          <PlusSquare className="addButton" onClick={onValueAdd} />
          <h4>Breaks</h4>
          {context.columns.find((column) => column.name === fieldname)?.type ===
            "string" || mode === "byvalue" ? (
            <MultiTextField values={breaks} onChange={onBreaksEdit} />
          ) : (
            <div style={{ width: "calc(100% - 2em)" }}>
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
              <Histogram
                viewboxHeight={10}
                left={minBreak}
                right={maxBreak}
                binWidth={breakStep}
                values={context.filteredData.map((feature) => {
                  const col = context.columns.find(
                    (column) => column.name === fieldname,
                  );
                  if (!col) return null;
                  return toType(feature.properties[col.name], col.type);
                })}
              />
            </div>
          )}
        </div>
      ) : null}
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
  const context = useContext(DataContext);
  const [fieldname, setFieldname] = useState(
    definition?.fieldname ?? context.columns[0]?.name,
  );
  const [mode, setMode] = useState(definition?.mode ?? "discrete");
  const [values, setValues] = useState(definition?.values ?? [minValue]);
  const [breaks, setBreaks] = useState(definition?.breaks ?? []);
  const [defaultValue, setDefault] = useState(definition?.default ?? minValue);
  const [type, setType] = useState(
    context.columns.find((c) => c.name === fieldname)?.type,
  );

  let minBreak = 0;
  let maxBreak = 100;
  let breakStep = 10;
  if (context.columns.find((column) => column.name === fieldname)) {
    const column = context.columns.find((column) => column.name === fieldname);
    const columnData = context.filteredData
      .map((f) => toType(f.properties[column.name], column.type))
      .filter((d) => d);
    if (columnData && columnData.length) {
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
          breakStep = Math.pow(
            10,
            Math.round(
              Math.log10((Date.parse(columnMax) - Date.parse(columnMin)) / 20),
            ),
          );
          minBreak = breakStep * Math.floor(Date.parse(columnMin) / breakStep);
          maxBreak = breakStep * Math.ceil(Date.parse(columnMax) / breakStep);
        } else if (typeof columnMin === "number") {
          // get power of 10 that splits the range into roughly 20 - TODO make more date-friendly breaks
          breakStep = Math.pow(
            10,
            Math.round(Math.log10((columnMax - columnMin) / 20)),
          );
          minBreak = breakStep * Math.floor(columnMin / breakStep);
          maxBreak = breakStep * Math.ceil(columnMax / breakStep);
        } else if (columnMin instanceof Date) {
          // get power of 10 that splits the range into roughly 20 - TODO make more date-friendly breaks
          breakStep = Math.pow(
            10,
            Math.round(
              Math.log10((columnMax.getTime() - columnMin.getTime()) / 20),
            ),
          );
          minBreak = breakStep * Math.floor(columnMin.getTime() / breakStep);
          maxBreak = breakStep * Math.ceil(columnMax.getTime() / breakStep);
        }
      } else {
        // get power of 10 that splits the range into roughly 20
        breakStep = Math.pow(
          10,
          Math.round(Math.log10((columnMax - columnMin) / 20)),
        );
        minBreak = breakStep * Math.floor(columnMin / breakStep);
        maxBreak = breakStep * Math.ceil(columnMax / breakStep);
      }
    }
  }

  const onCheckboxChange = (event) => {
    onEdit(
      event.target.checked
        ? { mode, values, fieldname, type, breaks, default: defaultValue }
        : undefined,
    );
  };
  const onFieldnameEdit = (event) => {
    const newFieldname = event.target.value;
    const newType = context.columns.find((c) => c.name === newFieldname).type;
    const modeOptions = modesForType(newType).map((m) => m.name);
    const newMode = modeOptions.includes(mode) ? mode : modeOptions[0];
    setFieldname(newFieldname);
    setType(newType);
    if (newMode !== mode) {
      onModeEdit({ target: { value: newMode } });
      setMode(newMode);
    }
    onEdit({
      mode: newMode,
      values,
      fieldname: newFieldname,
      type: newType,
      breaks,
      default: defaultValue,
    });
  };
  const onModeEdit = (event) => {
    const newMode = event.target.value;
    let newBreaks = breaks;
    let newValues = values;

    // ensure minimum values for the symbology mode is met
    const modeDefinition = symbologyModes[newMode];
    if (values.length < modeDefinition.minimumValues) {
      newValues = [
        ...values,
        ...Array(modeDefinition.minimumValues - values.length).fill(minValue),
      ];
    }
    // ensure correct number of breaks for the symbology mode is met
    const numBreaks = modeDefinition.numBreaks(newValues.length);
    if (breaks.length < newValues.length) {
      newBreaks = [
        ...breaks,
        ...Array(numBreaks - breaks.length).fill(minBreak),
      ];
    } else {
      newBreaks = breaks.slice(0, numBreaks);
    }

    setMode(newMode);
    setValues(newValues);
    setBreaks(newBreaks);
    onEdit({
      mode: newMode,
      values: newValues,
      fieldname,
      type,
      breaks: newBreaks,
      default: defaultValue,
    });
  };
  const onDefaultEdit = (newDefault) => {
    setDefault(newDefault);
    onEdit({ mode, values, fieldname, type, breaks, default: newDefault });
  };
  const onValuesEdit = (value, idx) => {
    const newValues = values.map((v, i) => (i === idx ? value : v));
    setValues(newValues);
    onEdit({
      mode,
      values: newValues,
      fieldname,
      type,
      breaks,
      default: defaultValue,
    });
  };
  const onValueAdd = (event) => {
    setValues(
      Array.isArray(values) ? [...values, minValue] : [values, minValue],
    );
    setBreaks(
      Array.isArray(breaks) ? [...breaks, minBreak] : [breaks, minBreak],
    );
    onEdit({
      mode,
      values: Array.isArray(values)
        ? [...values, minValue]
        : [values, minValue],
      fieldname,
      type,
      breaks: Array.isArray(breaks)
        ? [...breaks, minBreak]
        : [breaks, minBreak],
      default: defaultValue,
    });
  };
  const onValueRemove = (event) => {
    if (
      !Array.isArray(values) ||
      values.length <= symbologyModes[mode].minimumValues
    ) {
      return;
    }
    setValues(values.slice(0, values.length - 1));
    setBreaks(Array.isArray(breaks) ? breaks.slice(0, breaks.length - 1) : []);
    onEdit({
      mode,
      values: values.slice(0, values.length - 1),
      fieldname,
      type,
      breaks: Array.isArray(breaks) ? breaks.slice(0, breaks.length - 1) : [],
      default: defaultValue,
    });
  };
  const onBreaksEdit = (event, breaks) => {
    const newBreaks = (Array.isArray(breaks) ? breaks : [breaks]).map((b) =>
      toType(b, type),
    );
    setBreaks(newBreaks);
    onEdit({
      mode,
      values,
      fieldname,
      type,
      breaks: newBreaks,
      default: defaultValue,
    });
  };

  return (
    <div className="symbologyProperty">
      <h3 onContextMenu={() => console.log(definition)}>
        <LabeledCheckbox
          checked={definition ? true : false}
          onChange={onCheckboxChange}
          label={name.toUpperCase()}
        />
      </h3>
      {definition ? (
        <div style={{ paddingLeft: "1em" }}>
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
            options={modesForType(
              context.columns.find((column) => column.name === fieldname)?.type,
            ).map((m) => m.name)}
          />
          <h4>Default Value</h4>
          <p>
            Used for <em>null</em>, <em>undefined</em> field values.
          </p>
          <Slider
            min={minValue}
            max={maxValue}
            step={
              valueStep ??
              Math.pow(10, Math.round(Math.log10((maxValue - minValue) / 20)))
            }
            value={defaultValue}
            onChange={(event, defaultValue) => {
              onDefaultEdit(defaultValue);
            }}
            valueLabelDisplay="on"
            valueLabelFormat={valueLabelFormat}
            track={false}
            marks
          />
          <h4>Values</h4>
          <div style={{ width: "calc(100% - 2em)" }}>
            {values.map((value, idx) => (
              <Slider
                key={idx}
                min={minValue}
                max={maxValue}
                step={
                  valueStep ??
                  Math.pow(
                    10,
                    Math.round(Math.log10((maxValue - minValue) / 20)),
                  )
                }
                value={value}
                onChange={(event, value) => {
                  onValuesEdit(value, idx);
                }}
                valueLabelDisplay="on"
                valueLabelFormat={valueLabelFormat}
                track={false}
                marks
              />
            ))}
          </div>
          <MinusSquare
            className={`removeButton${values.length > symbologyModes[mode].minimumValues ? "" : "Disabled"}`}
            onClick={onValueRemove}
          />
          <PlusSquare className="addButton" onClick={onValueAdd} />
          <h4>Breaks</h4>
          {context.columns.find((column) => column.name === fieldname)?.type ===
            "string" || mode === "byvalue" ? (
            <MultiTextField values={breaks} onChange={onBreaksEdit} />
          ) : (
            <div style={{ width: "calc(100% - 2em)" }}>
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
              <Histogram
                viewboxHeight={10}
                left={minBreak}
                right={maxBreak}
                binWidth={breakStep}
                values={context.filteredData.map((feature) => {
                  const col = context.columns.find(
                    (column) => column.name === fieldname,
                  );
                  if (!col) return null;
                  return toType(feature.properties[col.name], col.type);
                })}
              />
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

export default SymbologyView;
