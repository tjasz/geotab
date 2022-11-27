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

// TODO cache counts
export function Histogram({left, right, binWidth, values, width, height}) {
  const bins = Array(Math.ceil((right - left)/binWidth)).fill(0);
  let maxCount = 0;
  for (const val of values)
  {
    const bin = Math.floor((val-left)/binWidth);
    bins[bin]++;
    if (bins[bin] > maxCount) maxCount = bins[bin];
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width} height={height}
      viewBox="0 0 100 100"
      >
      {bins.map((count, i) => <path d={`M${100*(i*binWidth)/(right - left)} 100 V${100 - 100*count/maxCount} H${100*((i+1)*binWidth)/(right - left)} V100 Z`} />)}
    </svg>
  );
}