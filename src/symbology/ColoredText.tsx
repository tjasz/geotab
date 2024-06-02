import { FC } from "react";

export interface IColoredTextProps {
  color: string;
  children: string;
}

export const ColoredText: FC<IColoredTextProps> = (props) => {
  return <span style={{ color: props.color }}>{props.children}</span>;
};

export default ColoredText;
