export function Select(props) {
  return (
    <select {...props}>
      {props.options.map((option) => <option value={option} key={option}>{option}</option>)}
    </select>
  );
}