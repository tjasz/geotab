import React, { ReactNode, Children } from "react";

type SplitViewProps = {
  children: ReactNode
};
type SplitViewState = {
  widths: string[];
};

const dividerWidth = "10px";

export class SplitView extends React.Component<SplitViewProps, SplitViewState> {
  constructor(props: SplitViewProps) {
    super(props);

    const count = Children.count(this.props.children);
    const defaultPaneWidth = `calc((100% - (${count - 1} * ${dividerWidth})) / ${count})`;
    this.state = {
      widths: Array(count).fill(defaultPaneWidth)
    }
  }

  render() {
    const children = Children.toArray(this.props.children);

    const toPane = (child, i: number) =>
      <div className="splitview-pane" style={{ width: this.state.widths[i], float: "left" }}>
        {child}
      </div>

    return <div className="splitview" style={{ width: "100%" }}>
      {children.slice(0, -1).map((child, i) =>
        <>
          {toPane(child, i)}
          <div className="splitview-divider" style={{ height: "100px", width: dividerWidth, float: "left", backgroundColor: "black" }}></div>
        </>
      )}
      {toPane(children.at(children.length - 1), children.length - 1)}
    </div>
  }
}