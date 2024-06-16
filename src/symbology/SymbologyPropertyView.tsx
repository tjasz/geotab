import { useContext, useState } from "react";
import { Histogram, Select } from "../common-components";
import { DataContext } from "../dataContext";
import { FieldTypeDescription, toType } from "../fieldtype";
import { LabeledCheckbox } from "../LabeledCheckbox";
import { modesForType, symbologyModes, SymbologyProperty } from "../painter";
import { Slider } from "@mui/material";
import MultiTextField from "./MultiTextField";
// @ts-expect-error
import { ReactComponent as MinusSquare } from "../feather/minus-square.svg";
// @ts-expect-error
import { ReactComponent as PlusSquare } from "../feather/plus-square.svg";

type SymbologyPropertyViewProps<T> = {
  name: string;
  definition: SymbologyProperty<T>;
  allowContinuous: boolean;
  onEdit: (v: SymbologyProperty<T> | undefined) => void;
  placeholderValue: T;
  onRenderSelector: (value: T, onChange: (v: T) => void, key?: string) => JSX.Element;
}
export function SymbologyPropertyView<T>({
  name,
  definition,
  allowContinuous,
  onEdit,
  placeholderValue,
  onRenderSelector,
}: SymbologyPropertyViewProps<T>) {
  // initialize the component state
  const context = useContext(DataContext);
  const [fieldname, setFieldname] = useState(
    definition?.fieldname ?? context?.columns[0]?.name,
  );
  const [mode, setMode] = useState(definition?.mode ?? "discrete");
  const [values, setValues] = useState(definition?.values ?? [placeholderValue]);
  const [breaks, setBreaks] = useState(definition?.breaks ?? []);
  const [defaultValue, setDefault] = useState(definition?.default ?? placeholderValue);
  const [type, setType] = useState(
    context?.columns.find((c) => c.name === fieldname)?.type ?? FieldTypeDescription.String,
  );

  // find where the appropraite breaks in the field property values should be
  let minBreak = 0;
  let maxBreak = 100;
  let breakStep = 10;
  const column = context?.columns.find((column) => column.name === fieldname);
  if (column) {
    const columnData = context!.filteredData
      .map((f) => toType(f.properties[column.name], column.type))
      .filter((d) => d);
    if (columnData && columnData.length) {
      var columnMin = Math.min(...columnData) as any;
      var columnMax = Math.max(...columnData) as any;
      // gracefully handle case where the column has only one non-null value
      if (columnMin === columnMax) {
        if (columnMax > 0) {
          columnMin = 0;
        } else {
          columnMax = 0;
        }
      }
      if (column.type === "date") {
        if (typeof columnMin === "string" && typeof columnMax === "string") {
          // get power of 10 that splits the range into roughly 20 - TODO make more date-friendly breaks
          breakStep = Math.pow(
            10,
            Math.round(
              Math.log10((Date.parse(columnMax) - Date.parse(columnMin)) / 20),
            ),
          );
          minBreak = breakStep * Math.floor(Date.parse(columnMin) / breakStep);
          maxBreak = breakStep * Math.ceil(Date.parse(columnMax) / breakStep);
        } else if (typeof columnMin === "number" && typeof columnMax === "number") {
          // get power of 10 that splits the range into roughly 20 - TODO make more date-friendly breaks
          breakStep = Math.pow(
            10,
            Math.round(Math.log10((columnMax - columnMin) / 20)),
          );
          minBreak = breakStep * Math.floor(columnMin / breakStep);
          maxBreak = breakStep * Math.ceil(columnMax / breakStep);
        } else if (columnMin instanceof Date && columnMax instanceof Date) {
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
    const newType = context?.columns.find((c) => c.name === newFieldname)?.type;
    if (!newType) {
      throw new Error(`Could not find column ${newFieldname} among columns: ${context?.columns.join(", ")}`)
    }
    const modesForNewType = modesForType(newType).map((m) => m.name)
    const modeOptions = allowContinuous ? modesForNewType : modesForNewType.filter(m => m !== "continuous");
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
        ...Array(modeDefinition.minimumValues - values.length).fill(placeholderValue),
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
      Array.isArray(values) ? [...values, placeholderValue] : [values, placeholderValue],
    );
    setBreaks(
      Array.isArray(breaks) ? [...breaks, minBreak] : [breaks, minBreak],
    );
    onEdit({
      mode,
      values: Array.isArray(values)
        ? [...values, placeholderValue]
        : [values, placeholderValue],
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
      toType(b, type ?? "string"),
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
            options={context?.columns.map((column) => column.name) ?? []}
          />
          <Select
            id={`symbology-${name}-mode`}
            name={`symbology-${name}-mode`}
            defaultValue={mode}
            value={mode}
            onChange={onModeEdit}
            options={modesForType(
              context?.columns.find((column) => column.name === fieldname)?.type,
            ).map((m) => m.name).filter(m => allowContinuous || m !== "continuous")}
          />
          <h4>Default Value</h4>
          <p>
            Used for <em>null</em>, <em>undefined</em> field values.
          </p>
          {onRenderSelector(defaultValue, onDefaultEdit)}
          <h4>Values</h4>
          <div style={{ width: "calc(100% - 2em)" }}>
            {values.map((value, idx) =>
              onRenderSelector(value, s => onValuesEdit(s, idx), `symbology-${name}-value-${idx}`))}
          </div>
          <MinusSquare
            className={`removeButton${values.length > symbologyModes[mode].minimumValues ? "" : "Disabled"}`}
            onClick={onValueRemove}
          />
          <PlusSquare className="addButton" onClick={onValueAdd} />
          <h4>Breaks</h4>
          {context?.columns.find((column) => column.name === fieldname)?.type ===
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
                valueLabelFormat={(v) => JSON.stringify(toType(v, type ?? "string"))}
                track={false}
                marks
              />
              <Histogram
                viewboxHeight={10}
                left={minBreak}
                right={maxBreak}
                binWidth={breakStep}
                values={context?.filteredData.map((feature) => {
                  const col = context?.columns.find(
                    (column) => column.name === fieldname,
                  );
                  if (!col) return null;
                  return toType(feature.properties[col.name], col.type);
                }) ?? []}
              />
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}