import { Slider } from "@mui/material"
import { SymbologyProperty } from "../painter";
import { SymbologyPropertyView } from "./SymbologyPropertyView"

export type NumericSymbologyPropertyViewProps = {
  name: string;
  definition: SymbologyProperty<number>;
  onEdit: (v: SymbologyProperty<number> | undefined) => void;
  minValue: number;
  maxValue: number;
  valueStep?: number;
  valueLabelFormat?: (value: number) => JSX.Element;
};
export function NumericSymbologyPropertyView({
  name,
  definition,
  onEdit,
  minValue,
  maxValue,
  valueStep,
  valueLabelFormat,
}: NumericSymbologyPropertyViewProps) {
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
        onChange={(event, value) => onChange(value as number)}
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