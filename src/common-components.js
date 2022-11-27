export function Select(props) {
  return (
    <select {...props}>
      {props.options.map((option) => <option value={option} key={option}>{option}</option>)}
    </select>
  );
}

export function ColoredText({color, text}) {
  return (
    <span style={{color: color}}>
      {text}
    </span>
  );
}

export function MultiTextField(props) {
  const onChildChange = (event, value, idx) => {
    const newValues = props.values.map((v,i) => i === idx ? value : v);
    props.onChange(event, newValues);
  };
  return (
    <div>
      {props.values.map((value, idx) => 
        <input
          value={value}
          onChange={(event) => onChildChange(event, event.target.value, idx)}
          key={`${idx}`}/>)}
    </div>
  );
}