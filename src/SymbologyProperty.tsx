import { useContext, useState } from "react";
import { DataContext } from "./dataContext";
import { toType } from "./fieldtype";

type NumericOptionsDefinition<T> = {
  min: T;
  max: T;
  step: T;
}
type NonNumericOptionsDefinition<T> = {
  options: T[];
}
type OptionsDefinition<T> = NumericOptionsDefinition<T> | NonNumericOptionsDefinition<T>;
// TODO instead of "minValue", "maxValue", "valueStep" for numbers and "options" for non-numbers, pass ???
// TODO instead of "valueLabelFormat", pass Slider for numbers and Select for non-numbers
function SymbologyProperty({
  name,
  definition,
  onEdit,
}) {
  // initialize the component state
  const context = useContext(DataContext);
  const [fieldname, setFieldname] = useState(
    definition?.fieldname ?? context?.columns[0]?.name,
  );
  const [mode, setMode] = useState(definition?.mode ?? "discrete");
  const [values, setValues] = useState(definition?.values ?? [minValue]);
  const [breaks, setBreaks] = useState(definition?.breaks ?? []);
  const [defaultValue, setDefault] = useState(definition?.default ?? minValue);
  const [type, setType] = useState(
    context?.columns.find((c) => c.name === fieldname)?.type,
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
          <p>TODO disable continuous mode for non-numbers</p>
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
          <p>TODO Slider for numbers, Select for non-numbers</p>
          <SvgSelect
            value={defaultValue}
            options={valueOptions}
            onChange={(s) => onDefaultEdit(s)}
          />
          <h4>Values</h4>
          <p>TODO Slider for numbers, Select for non-numbers</p>
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
}