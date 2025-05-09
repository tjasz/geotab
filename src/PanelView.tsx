import React, { useState, ReactNode, useEffect, useRef } from 'react';
import { ArrowRight, ArrowLeft, ArrowDropUp, ArrowDropDown } from '@mui/icons-material';

type PanelViewProps = {
  leftPanel?: ReactNode;
  rightPanel?: ReactNode;
  bottomPanel?: ReactNode;
  children: ReactNode;
  leftPanelWidth?: number;
  rightPanelWidth?: number;
  bottomPanelHeight?: number;
  leftPanelTitle?: string;
  rightPanelTitle?: string;
  bottomPanelTitle?: string;
  style?: React.CSSProperties;
};

/**
 * PanelView component with expandable left, right, and bottom panels
 * @param leftPanel - Content for the left panel
 * @param rightPanel - Content for the right panel
 * @param bottomPanel - Content for the bottom panel
 * @param children - Content for the main area
 * @param leftPanelWidth - Default width of left panel in pixels (default: 300)
 * @param rightPanelWidth - Default width of right panel in pixels (default: 300)
 * @param bottomPanelHeight - Default height of bottom panel in pixels (default: 200)
 * @param leftPanelTitle - Title for the left panel
 * @param rightPanelTitle - Title for the right panel
 * @param bottomPanelTitle - Title for the bottom panel
 * @param style - Additional CSS styles to apply to the root container
 */
export function PanelView({
  leftPanel,
  rightPanel,
  bottomPanel,
  children,
  leftPanelWidth = 300,
  rightPanelWidth = 300,
  bottomPanelHeight = 200,
  leftPanelTitle = 'Left Panel',
  rightPanelTitle = 'Right Panel',
  bottomPanelTitle = 'Bottom Panel',
  style
}: PanelViewProps) {
  const [leftPanelExpanded, setLeftPanelExpanded] = useState(true);
  const [rightPanelExpanded, setRightPanelExpanded] = useState(true);
  const [bottomPanelExpanded, setBottomPanelExpanded] = useState(true);
  const [currentLeftWidth, setCurrentLeftWidth] = useState(leftPanelWidth);
  const [currentRightWidth, setCurrentRightWidth] = useState(rightPanelWidth);
  const [currentBottomHeight, setCurrentBottomHeight] = useState(bottomPanelHeight);
  const [isDraggingLeft, setIsDraggingLeft] = useState(false);
  const [isDraggingRight, setIsDraggingRight] = useState(false);
  const [isDraggingBottom, setIsDraggingBottom] = useState(false);
  const [dragDistance, setDragDistance] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartXRef = useRef<number | null>(null);
  const dragStartYRef = useRef<number | null>(null);

  // Update container dimensions on mount and window resize
  useEffect(() => {
    const updateContainerDimensions = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
        setContainerHeight(containerRef.current.clientHeight);
      }
    };

    updateContainerDimensions();
    window.addEventListener('resize', updateContainerDimensions);

    return () => {
      window.removeEventListener('resize', updateContainerDimensions);
    };
  }, []);

  const toggleLeftPanel = () => {
    setLeftPanelExpanded(!leftPanelExpanded);
  };

  const toggleRightPanel = () => {
    setRightPanelExpanded(!rightPanelExpanded);
  };

  const toggleBottomPanel = () => {
    setBottomPanelExpanded(!bottomPanelExpanded);
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

  const handleBottomDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (bottomPanelExpanded) {
      e.preventDefault();
      setIsDraggingBottom(true);
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
      dragStartYRef.current = clientY;
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

  const handleBottomPanelClick = (e: React.MouseEvent | React.TouchEvent) => {
    if (Math.abs(dragDistance) < 5) {
      toggleBottomPanel();
    }
  };

  // Determine if toggle buttons should be positioned inside the panels
  const isLeftPanelNearlyFullWidth = containerWidth > 0 && (currentLeftWidth > containerWidth - 24);
  const isRightPanelNearlyFullWidth = containerWidth > 0 && (currentRightWidth > containerWidth - 24);
  const isBottomPanelNearlyFullHeight = containerHeight > 0 && (currentBottomHeight > containerHeight - 24);

  // Calculate positions for toggle buttons
  const leftToggleMargin = leftPanelExpanded ?
    (isLeftPanelNearlyFullWidth ? currentLeftWidth - 12 : currentLeftWidth) : 0;

  const rightToggleMargin = rightPanelExpanded ?
    (isRightPanelNearlyFullWidth ? currentRightWidth - 12 : currentRightWidth) : 0;

  const bottomToggleMargin = bottomPanelExpanded ?
    (isBottomPanelNearlyFullHeight ? currentBottomHeight - 12 : currentBottomHeight) : 0;

  // Handle mouse/touch move for resizing
  useEffect(() => {
    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;

      if (dragStartXRef.current !== null) {
        const currentDragDistance = clientX - dragStartXRef.current;
        setDragDistance(currentDragDistance);
      }

      if (dragStartYRef.current !== null) {
        const currentDragDistance = clientY - dragStartYRef.current;
        setDragDistance(currentDragDistance);
      }

      if (isDraggingLeft && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const newWidth = Math.max(0, clientX - containerRect.left);
        setCurrentLeftWidth(newWidth);
      }

      if (isDraggingRight && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const newWidth = Math.max(0, containerRect.right - clientX);
        setCurrentRightWidth(newWidth);
      }

      if (isDraggingBottom && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const newHeight = Math.max(0, containerRect.bottom - clientY);
        setCurrentBottomHeight(newHeight);
      }
    };

    const handlePointerUp = () => {
      setIsDraggingLeft(false);
      setIsDraggingRight(false);
      setIsDraggingBottom(false);
      // Keep dragDistance for a short time to let the click handler check it
      setTimeout(() => {
        dragStartXRef.current = null;
        dragStartYRef.current = null;
        setDragDistance(0);
      }, 100);
    };

    if (isDraggingLeft || isDraggingRight || isDraggingBottom) {
      // Add both mouse and touch event listeners
      document.addEventListener('mousemove', handlePointerMove);
      document.addEventListener('touchmove', handlePointerMove, { passive: false });
      document.addEventListener('mouseup', handlePointerUp);
      document.addEventListener('touchend', handlePointerUp);

      // Set cursor style on body during drag
      document.body.style.cursor = isDraggingBottom ? 'ns-resize' : 'ew-resize';
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
  }, [isDraggingLeft, isDraggingRight, isDraggingBottom]);

  return (
    <div className="panel-view-container" style={style} ref={containerRef}>
      <div className="panel-view-row">
        {/* Left panel */}
        {leftPanel && leftPanelExpanded && (
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
              marginLeft: Math.min(leftToggleMargin, containerWidth - 12),
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
              marginRight: Math.min(rightToggleMargin, containerWidth - 12),
              cursor: rightPanelExpanded ? 'ew-resize' : 'pointer',
              transition: isDraggingRight ? 'none' : 'margin-right 0.3s ease'
            }}
          >
            {rightPanelExpanded ? <ArrowRight /> : <ArrowLeft />}
          </div>
        )}

        {/* Right panel */}
        {rightPanel && rightPanelExpanded && (
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

      {/* Bottom panel toggle button */}
      {bottomPanel && (
        <div
          className="panel-toggle bottom-panel-toggle"
          onClick={handleBottomPanelClick}
          onMouseDown={handleBottomDragStart}
          onTouchStart={handleBottomDragStart}
          title={bottomPanelExpanded ? "Hide bottom panel" : "Show bottom panel"}
          style={{
            marginBottom: Math.min(bottomToggleMargin, containerHeight - 12),
            cursor: bottomPanelExpanded ? 'ns-resize' : 'pointer',
            transition: isDraggingBottom ? 'none' : 'margin-bottom 0.3s ease'
          }}
        >
          {bottomPanelExpanded ? <ArrowDropDown /> : <ArrowDropUp />}
        </div>
      )}

      {/* Bottom panel */}
      {bottomPanel && bottomPanelExpanded && (
        <div
          className="panel bottom-panel"
          style={{
            height: bottomPanelExpanded ? currentBottomHeight : 0,
            transition: isDraggingBottom ? 'none' : 'height 0.3s ease'
          }}
        >
          <div className="panel-header">
            <h3>{bottomPanelTitle}</h3>
          </div>
          <div className="panel-content">
            {bottomPanel}
          </div>
        </div>
      )}
    </div>
  );
}

export default PanelView;