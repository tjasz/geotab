export function LabeledCheckbox({checked, onChange, label, style}) {
  style = style ?? ((checked) => checked ? {color: "black", textDecoration: "none"} : {color: "gray", textDecoration: "line-through"});
  return (
    <label style={style(checked)}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        />
        {label}
    </label>
  );
}