import { useMeasure } from "@uidotdev/usehooks";
import { ReactNode, Children, useState } from "react";

type SplitViewProps = {
  children: ReactNode
};

export function SplitView(props: SplitViewProps) {
  const count = Children.count(props.children);
  const defaultPaneWidth = 300; //`calc((100% - (${count - 1} * ${dividerWidth})) / ${count})`; TODO
  const [widths, setWidths] = useState<number[]>(Array(count - 1).fill(defaultPaneWidth));

  const children = Children.toArray(props.children);

  console.log(widths)

  return <div className="splitview" style={{ width: "100%" }}>
    {children.slice(0, -1).map((child, idx) =>
      <Pane
        resize="horizontal"
        initialWidth={`${widths[idx]}px`}
        onWidthChange={newWidth => setWidths(widths.map((v, i) => idx === i ? newWidth : v))}
      >
        {child}
      </Pane>
    )}
    <Pane
      resize="none"
      initialWidth={`calc(100% - ${widths.reduce((sum, v) => sum + v, 0)}px)`}
      onWidthChange={() => { }}
    >
      {children.at(children.length - 1)}
    </Pane>
  </div >
}

type PaneProps = {
  children: ReactNode,
  resize: "horizontal" | "none",
  initialWidth: string,
  onWidthChange: (v: number) => void,
}

function Pane(props: PaneProps) {
  const [ref, { width, height }] = useMeasure();



  return <div
    ref={ref}
    className="splitview-pane"
    style={{ resize: props.resize, overflow: "scroll", width: props.initialWidth, float: "left" }}
    onMouseMove={() => props.onWidthChange(width ?? 0)}
  >
    {props.children}
  </div>
}
