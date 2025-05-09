import React, { useState, ReactNode } from 'react';
import { ArrowRight, ArrowLeft } from '@mui/icons-material';

type PanelViewProps = {
  leftPanel?: ReactNode;
  rightPanel?: ReactNode;
  children: ReactNode;
  leftPanelWidth?: number;
  rightPanelWidth?: number;
  leftPanelTitle?: string;
  rightPanelTitle?: string;
  style?: React.CSSProperties;
};

/**
 * PanelView component with expandable left and right panels
 * @param leftPanel - Content for the left panel
 * @param rightPanel - Content for the right panel
 * @param children - Content for the main area
 * @param leftPanelWidth - Default width of left panel in pixels (default: 300)
 * @param rightPanelWidth - Default width of right panel in pixels (default: 300)
 * @param leftPanelTitle - Title for the left panel
 * @param rightPanelTitle - Title for the right panel
 * @param style - Additional CSS styles to apply to the root container
 */
export function PanelView({
  leftPanel,
  rightPanel,
  children,
  leftPanelWidth = 300,
  rightPanelWidth = 300,
  leftPanelTitle = 'Left Panel',
  rightPanelTitle = 'Right Panel',
  style
}: PanelViewProps) {
  const [leftPanelExpanded, setLeftPanelExpanded] = useState(true);
  const [rightPanelExpanded, setRightPanelExpanded] = useState(true);

  const toggleLeftPanel = () => {
    setLeftPanelExpanded(!leftPanelExpanded);
  };

  const toggleRightPanel = () => {
    setRightPanelExpanded(!rightPanelExpanded);
  };

  return (
    <div className="panel-view-container" style={style}>
      {/* Left panel */}
      {leftPanel && (
        <div
          className="panel left-panel"
          style={{
            width: leftPanelExpanded ? leftPanelWidth : 0,
            marginLeft: leftPanelExpanded ? 0 : -leftPanelWidth
          }}
        >
          <div className="panel-header">
            <h3>{leftPanelTitle}</h3>
          </div>
          <div className="panel-content">
            {leftPanel}
          </div>
        </div>
      )}

      {/* Left panel toggle button */}
      {leftPanel && (
        <div
          className="panel-toggle left-panel-toggle"
          onClick={toggleLeftPanel}
          title={leftPanelExpanded ? "Hide left panel" : "Show left panel"}
        >
          {leftPanelExpanded ? <ArrowLeft /> : <ArrowRight />}
        </div>
      )}

      {/* Main content */}
      <div className="main-content">
        {children}
      </div>

      {/* Right panel toggle button */}
      {rightPanel && (
        <div
          className="panel-toggle right-panel-toggle"
          onClick={toggleRightPanel}
          title={rightPanelExpanded ? "Hide right panel" : "Show right panel"}
        >
          {rightPanelExpanded ? <ArrowRight /> : <ArrowLeft />}
        </div>
      )}

      {/* Right panel */}
      {rightPanel && (
        <div
          className="panel right-panel"
          style={{
            width: rightPanelExpanded ? rightPanelWidth : 0,
            marginRight: rightPanelExpanded ? 0 : -rightPanelWidth
          }}
        >
          <div className="panel-header">
            <h3>{rightPanelTitle}</h3>
          </div>
          <div className="panel-content">
            {rightPanel}
          </div>
        </div>
      )}
    </div>
  );
}

export default PanelView;