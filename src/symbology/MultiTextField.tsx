import { FC } from "react";

export interface IMultiTextFieldProps {
  values: string[];
  onChange: {
    (event: React.ChangeEvent<HTMLInputElement>, newValues: string[]): void;
  };
}

export const MultiTextField: FC<IMultiTextFieldProps> = (props) => {
  const onChildChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    value: string,
    idx: number,
  ) => {
    const newValues = props.values.map((v, i) => (i === idx ? value : v));
    props.onChange(event, newValues);
  };
  return (
    <div>
      {props.values.map((value, idx) => (
        <input
          value={value}
          onChange={(event) => onChildChange(event, event.target.value, idx)}
          key={`${idx}`}
        />
      ))}
    </div>
  );
};

export default MultiTextField;
