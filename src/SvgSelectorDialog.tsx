import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import { pointsToPatternPath } from "./PatternRenderer/SvgPatternRenderer";
import React, { useState } from "react";
import { SvgOptions, SvgPatternWithLabel } from "./PatternRenderer/options";

type SvgSelectProps = {
  value: SvgPatternWithLabel;
  options: SvgOptions;
  onChange: (v: SvgPatternWithLabel) => void;
  onOptionRender: (option: SvgPatternWithLabel, onClick: () => void, style: React.CSSProperties) => JSX.Element;
};
export function SvgSelect(props: SvgSelectProps) {
  const [expanded, setExpanded] = useState(false);
  return <>
    {props.onOptionRender(props.value, () => setExpanded(true), { cursor: "pointer" })}
    <SvgSelectorDialog
      open={expanded}
      onCancel={() => setExpanded(false)}
      onConfirm={(s: SvgPatternWithLabel) => { props.onChange(s); setExpanded(false) }}
      title="Choose a pattern"
      options={props.options}
      onOptionRender={props.onOptionRender}
    />
  </>
}

type SvgSelectorDialogProps = {
  onCancel: { (): void };
  onConfirm: { (s: SvgPatternWithLabel): void };
  open: boolean;
  title: string;
  description?: JSX.Element;
  options: SvgOptions;
  onOptionRender: (option: SvgPatternWithLabel, onClick: () => void, style: React.CSSProperties) => JSX.Element;
};

export function SvgSelectorDialog(props: SvgSelectorDialogProps) {
  const [searchString, setSearchString] = useState<string | null>(null);

  return (
    <Dialog onClose={props.onCancel} open={props.open}>
      <DialogTitle>{props.title}</DialogTitle>
      <DialogContent>
        {props.description}
        Search:
        <input type="text" onChange={e => setSearchString(e.target.value)} defaultValue={searchString ?? ""} />
        {Object.keys(props.options)
          .filter(group => searchString !== null && props.options[group].some(option => option.label.includes(searchString)))
          .map(group => {
            return <div key={group} style={{ display: "block", clear: "both" }}>
              <p>
                {group}
              </p>
              {props.options[group]
                .filter(option => searchString !== null && option.label.includes(searchString))
                .map(option => {
                  return <div
                    key={`${option.label}: ${option.pattern}`}
                    title={option.label}
                    style={{
                      float: "left",
                      margin: 5,
                    }}
                  >
                    {props.onOptionRender(
                      option,
                      () => props.onConfirm(option),
                      { cursor: "pointer", backgroundColor: "#eee", margin: 5 }
                    )}
                  </div>
                })}
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
  return <SvgPathPreview
    width={props.width}
    height={props.height}
    onClick={props.onClick}
    style={props.style}
    path={pointsToPatternPath([[{ x: 5, y: 0 }, { x: 95, y: 0 }]], false, props.pattern)}
    viewBox={`0 ${-props.height / 2} ${props.width} ${props.height}`}
    strokeWidth={2}
  />
}

export type SvgPathPreviewProps = {
  path: string;
  viewBox: string;
  width: number;
  height: number;
  onClick: () => void;
  style?: React.CSSProperties;
  strokeWidth: number;
  fill?: string;
}
export function SvgPathPreview(props: SvgPathPreviewProps) {
  return <svg
    width={props.width}
    height={props.height}
    viewBox={props.viewBox}
    onClick={props.onClick}
    onContextMenu={() => console.log(props.path)}
    style={props.style}
    fill="none"
  >
    <path
      d={props.path}
      strokeWidth={props.strokeWidth}
      stroke="black"
      fill={props.fill ?? "none"}
    />
  </svg>
}