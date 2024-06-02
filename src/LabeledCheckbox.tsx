import CSS from "csstype";
import React from "react";

type LabeledCheckboxProps = {
  checked: boolean;
  onChange: { (event: React.ChangeEvent<HTMLInputElement>): void };
  label: string;
  style?: { (checked: boolean): CSS.Properties };
};

export function LabeledCheckbox({
  checked,
  onChange,
  label,
  style,
}: LabeledCheckboxProps) {
  style =
    style ??
    ((checked) =>
      checked
        ? { color: "black", textDecoration: "none" }
        : { color: "gray", textDecoration: "line-through" });
  return (
    <label style={style(checked)}>
      <input type="checkbox" checked={checked} onChange={onChange} />
      {label}
    </label>
  );
}
