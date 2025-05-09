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
  const [dragDistance, setDragDistance] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartXRef = useRef<number | null>(null);

  const toggleLeftPanel = () => {
    setLeftPanelExpanded(!leftPanelExpanded);
  };

  const toggleRightPanel = () => {
    setRightPanelExpanded(!rightPanelExpanded);
  };

  // Handle mouse down on resize dividers
  const handleLeftDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (leftPanelExpanded) {
      e.preventDefault();
      setIsDraggingLeft(true);
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      dragStartXRef.current = clientX;
      setDragDistance(0);
    }
  };

  const handleRightDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (rightPanelExpanded) {
      e.preventDefault();
      setIsDraggingRight(true);
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      dragStartXRef.current = clientX;
      setDragDistance(0);
    }
  };

  // Handle click events, only toggle if no significant drag occurred
  const handleLeftPanelClick = (e: React.MouseEvent | React.TouchEvent) => {
    if (Math.abs(dragDistance) < 5) {
      toggleLeftPanel();
    }
  };

  const handleRightPanelClick = (e: React.MouseEvent | React.TouchEvent) => {
    if (Math.abs(dragDistance) < 5) {
      toggleRightPanel();
    }
  };

  // Handle mouse/touch move for resizing
  useEffect(() => {
    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;

      if (dragStartXRef.current !== null) {
        const currentDragDistance = clientX - dragStartXRef.current;
        setDragDistance(currentDragDistance);
      }

      if (isDraggingLeft && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const newWidth = Math.max(100, clientX - containerRect.left);
        setCurrentLeftWidth(newWidth);
      }

      if (isDraggingRight && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const newWidth = Math.max(100, containerRect.right - clientX);
        setCurrentRightWidth(newWidth);
      }
    };

    const handlePointerUp = () => {
      setIsDraggingLeft(false);
      setIsDraggingRight(false);
      // Keep dragDistance for a short time to let the click handler check it
      setTimeout(() => {
        dragStartXRef.current = null;
        setDragDistance(0);
      }, 100);
    };

    if (isDraggingLeft || isDraggingRight) {
      // Add both mouse and touch event listeners
      document.addEventListener('mousemove', handlePointerMove);
      document.addEventListener('touchmove', handlePointerMove, { passive: false });
      document.addEventListener('mouseup', handlePointerUp);
      document.addEventListener('touchend', handlePointerUp);

      // Set cursor style on body during drag
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
      document.body.style.touchAction = 'none'; // Prevent scrolling on touch devices
    }

    return () => {
      // Remove both mouse and touch event listeners
      document.removeEventListener('mousemove', handlePointerMove);
      document.removeEventListener('touchmove', handlePointerMove);
      document.removeEventListener('mouseup', handlePointerUp);
      document.removeEventListener('touchend', handlePointerUp);

      // Reset styles
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.body.style.touchAction = '';
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
          onClick={handleLeftPanelClick}
          onMouseDown={handleLeftDragStart}
          onTouchStart={handleLeftDragStart}
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
          onClick={handleRightPanelClick}
          onMouseDown={handleRightDragStart}
          onTouchStart={handleRightDragStart}
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