import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import { pointsToPatternPath } from "./PatternRenderer/SvgPatternRenderer";
import React, { useState } from "react";
import { SvgPatternWithLabel } from "./PatternRenderer/options";

type SvgSelectProps = {
  value: string;
  options: SvgPatternWithLabel[];
  onChange: (v: string) => void;
};
export function SvgSelect(props: SvgSelectProps) {
  const [expanded, setExpanded] = useState(false);
  return <>
    <SvgPatternPreview
      width={100}
      height={30}
      pattern={props.value}
      onClick={() => setExpanded(true)}
      style={{ cursor: "pointer" }}
    />
    <SvgSelectorDialog
      open={expanded}
      onCancel={() => setExpanded(false)}
      onConfirm={(s: string) => { props.onChange(s); setExpanded(false) }}
      title="Choose a pattern"
      options={props.options}
    />
  </>
}

type SvgSelectorDialogProps = {
  onCancel: { (): void };
  onConfirm: { (s: string): void };
  open: boolean;
  title: string;
  description?: JSX.Element;
  options: SvgPatternWithLabel[];
};

export function SvgSelectorDialog(props: SvgSelectorDialogProps) {
  return (
    <Dialog onClose={props.onCancel} open={props.open}>
      <DialogTitle>{props.title}</DialogTitle>
      <DialogContent>
        {props.description}
        {props.options.map(option => {
          return <div title={option.label} style={{ width: 100, float: "left", margin: 5 }}>
            <SvgPatternPreview
              key={`${option.label}: ${option.pattern}`}
              width={100}
              height={30}
              pattern={option.pattern}
              onClick={() => props.onConfirm(option.pattern)}
              style={{ cursor: "pointer", backgroundColor: "#c0c0c0", margin: 5 }}
            />
          </div>
        })}
      </DialogContent>
    </Dialog>
  );
}

export type SvgPatternPreviewProps = {
  pattern: string;
  width: number;
  height: number;
  onClick: () => void;
  style?: React.CSSProperties;
};
export function SvgPatternPreview(props: SvgPatternPreviewProps) {
  return <svg
    width={props.width}
    height={props.height}
    viewBox={`0 ${-props.height / 2} ${props.width} ${props.height}`}
    onClick={props.onClick}
    onContextMenu={() => console.log(props.pattern)}
    style={props.style}
  >
    <path
      d={pointsToPatternPath([[{ x: 5, y: 0 }, { x: 95, y: 0 }]], false, props.pattern)}
      strokeWidth="2"
      stroke="black"
    />
  </svg>
}