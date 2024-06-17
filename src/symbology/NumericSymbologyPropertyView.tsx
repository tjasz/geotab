import { Slider } from "@mui/material"
import { SymbologyPropertyView } from "./SymbologyPropertyView"

export function NumericSymbologyPropertyView({
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