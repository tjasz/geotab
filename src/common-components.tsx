export function Select(props: { options: string[] }): JSX.Element {
  return (
    <select {...props}>
      {props.options.map((option) => (
        <option value={option} key={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

// TODO cache counts
type HistogramProps = {
  left: number;
  right: number;
  binWidth: number;
  values: number[];
  viewboxHeight: number;
};
export function Histogram({
  left,
  right,
  binWidth,
  values,
  viewboxHeight,
}: HistogramProps): JSX.Element {
  const bins = Array(Math.ceil((right - left) / binWidth)).fill(0);
  let maxCount = 0;
  for (const val of values) {
    const bin =
      val === right ? bins.length - 1 : Math.floor((val - left) / binWidth);
    bins[bin]++;
    if (bins[bin] > maxCount) maxCount = bins[bin];
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 100 ${viewboxHeight}`}
    >
      {bins.map((count, i) => (
        <path
          key={i}
          d={`M${(100 * (i * binWidth)) / (right - left)} ${viewboxHeight} V${viewboxHeight - viewboxHeight * (maxCount === 0 ? 0 : count / maxCount)} H${(100 * ((i + 1) * binWidth)) / (right - left)} V${viewboxHeight} Z`}
        />
      ))}
    </svg>
  );
}
