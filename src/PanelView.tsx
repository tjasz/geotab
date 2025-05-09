import React, { useState, ReactNode, useEffect, useRef } from 'react';
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
  const [currentLeftWidth, setCurrentLeftWidth] = useState(leftPanelWidth);
  const [currentRightWidth, setCurrentRightWidth] = useState(rightPanelWidth);
  const [isDraggingLeft, setIsDraggingLeft] = useState(false);
  const [isDraggingRight, setIsDraggingRight] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleLeftPanel = () => {
    setLeftPanelExpanded(!leftPanelExpanded);
  };

  const toggleRightPanel = () => {
    setRightPanelExpanded(!rightPanelExpanded);
  };

  // Handle mouse down on resize dividers
  const handleLeftDragStart = (e: React.MouseEvent) => {
    if (leftPanelExpanded) {
      e.preventDefault();
      setIsDraggingLeft(true);
    }
  };

  const handleRightDragStart = (e: React.MouseEvent) => {
    if (rightPanelExpanded) {
      e.preventDefault();
      setIsDraggingRight(true);
    }
  };

  // Handle mouse move for resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingLeft && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const newWidth = Math.max(100, e.clientX - containerRect.left);
        setCurrentLeftWidth(newWidth);
      }

      if (isDraggingRight && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const newWidth = Math.max(100, containerRect.right - e.clientX);
        setCurrentRightWidth(newWidth);
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      e.preventDefault();
      setIsDraggingLeft(false);
      setIsDraggingRight(false);
    };

    if (isDraggingLeft || isDraggingRight) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      // Set cursor style on body during drag
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);

      // Reset cursor style
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDraggingLeft, isDraggingRight]);

  return (
    <div className="panel-view-container" style={style} ref={containerRef}>
      {/* Left panel */}
      {leftPanel && (
        <div
          className="panel left-panel"
          style={{
            width: leftPanelExpanded ? currentLeftWidth : 0,
            transition: isDraggingLeft ? 'none' : 'width 0.3s ease'
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
          onMouseDown={handleLeftDragStart}
          title={leftPanelExpanded ? "Hide left panel" : "Show left panel"}
          style={{
            marginLeft: leftPanelExpanded ? currentLeftWidth : 0,
            cursor: leftPanelExpanded ? 'ew-resize' : 'pointer',
            transition: isDraggingLeft ? 'none' : 'margin-left 0.3s ease'
          }}
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
          onMouseDown={handleRightDragStart}
          title={rightPanelExpanded ? "Hide right panel" : "Show right panel"}
          style={{
            marginRight: rightPanelExpanded ? currentRightWidth : 0,
            cursor: rightPanelExpanded ? 'ew-resize' : 'pointer',
            transition: isDraggingRight ? 'none' : 'margin-right 0.3s ease'
          }}
        >
          {rightPanelExpanded ? <ArrowRight /> : <ArrowLeft />}
        </div>
      )}

      {/* Right panel */}
      {rightPanel && (
        <div
          className="panel right-panel"
          style={{
            width: rightPanelExpanded ? currentRightWidth : 0,
            transition: isDraggingRight ? 'none' : 'width 0.3s ease'
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