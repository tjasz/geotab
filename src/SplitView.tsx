import React, { ReactNode, Children } from "react";
import DataView from "./dataview";
import MapView from "./mapview";
import TableView from "./table/tableview";
import SymbologyView from "./symbologyview";

type SplitViewProps = {
  children: ReactNode
};
type SplitViewState = {};

const dividerWidth = "10px";

export class SplitView extends React.Component<SplitViewProps, SplitViewState> {
  constructor(props: SplitViewProps) {
    super(props);
  }

  render() {
    const count = Children.count(this.props.children);

    const paneWidth = `calc((100% - (${count - 1} * ${dividerWidth})) / ${count})`;

    const children = Children.toArray(this.props.children);

    const toPane = (child) =>
      <div className="splitview-pane" style={{ width: paneWidth, float: "left" }}>
        {child}
      </div>

    return <div className="splitview" style={{ width: "100%" }}>
      {children.slice(0, -1).map(child =>
        <>
          {toPane(child)}
          <div className="splitview-divider" style={{ height: "100px", width: dividerWidth, float: "left", backgroundColor: "black" }}></div>
        </>
      )}
      {toPane(children.at(children.length - 1))}
    </div>
  }
}