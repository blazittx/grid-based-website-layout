import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { componentMap, buildWidgetsFromLayout } from "../../hooks/useWidgets";
import { useDragAndResize } from "../../hooks/useDragAndResize";
import { useAutosort } from "../../hooks/useAutosort";
import { useContextMenu } from "../../hooks/useContextMenu";
import { useToast } from "../../hooks/useToast";
import { usePageTransition } from "../../hooks/usePageTransition";
import ContextMenu from "../WidgetSystem/ContextMenu";
import GridBackground from "../WidgetSystem/GridBackground";
import GridMask from "../WidgetSystem/GridMask";
import WidgetContainer from "../WidgetSystem/WidgetContainer";
import Toaster from "../Toaster";
import {
  snapToGrid,
  snapSizeToGrid,
  constrainToViewport,
  calculateCenterOffset,
  pixelsToGrid,
} from "../../utils/grid";
import { findNearestValidPosition } from "../../utils/collision";
import { GRID_OFFSET_X, GRID_OFFSET_Y, GRID_SIZE } from "../../constants/grid";
import { getWidgetMinSize } from "../../constants/grid";
import {
  DEFAULT_TEMPLATE_PAGE_LAYOUT,
  DEFAULT_TEMPLATE_PAGE_LAYOUT_MOBILE,
} from "../../utils/setDefaultLayouts";
import { isMobile } from "../../utils/mobile";

/* eslint-disable react/prop-types */

const getTemplateLayout = (mobile) =>
  mobile ? DEFAULT_TEMPLATE_PAGE_LAYOUT_MOBILE : DEFAULT_TEMPLATE_PAGE_LAYOUT;

export default function PageTemplate() {
  const [widgets, setWidgets] = useState(() =>
    buildWidgetsFromLayout(getTemplateLayout(isMobile()), {
      mobile: isMobile(),
    })
  );
  const { animateInitial, animateWidgetsIn } = usePageTransition();
  const isInitialMountRef = useRef(true);

  const validWidgets = useMemo(
    () => (Array.isArray(widgets) ? widgets : []),
    [widgets]
  );

  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const [isMobileState, setIsMobileState] = useState(() => isMobile());
  const previousMobileStateRef = useRef(isMobileState);

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
      setIsMobileState(isMobile());
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setWindowSize]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Control") {
        document.body.classList.add("layout-mode");
      }
    };
    const handleKeyUp = (e) => {
      if (e.key === "Control") {
        document.body.classList.remove("layout-mode");
      }
    };
    const handleBlur = () => {
      document.body.classList.remove("layout-mode");
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleBlur);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleBlur);
    };
  }, []);

  const centerOffset = useMemo(() => {
    return calculateCenterOffset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [windowSize.width, windowSize.height]);

  const {
    isDragging,
    isResizing,
    collisionWidgetId,
    swapTargetId,
    dragStateRef,
    resizeStateRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    wasLastInteractionDrag,
  } = useDragAndResize(widgets, setWidgets, centerOffset);

  const autosortWidgets = useAutosort(widgets, setWidgets, centerOffset);
  const { contextMenu, openContextMenu, closeContextMenu } = useContextMenu();
  const { toasts, showToast, removeToast } = useToast();

  const toggleLockWidget = useCallback(
    (widgetId) => {
      setWidgets((prev) =>
        prev.map((w) => {
          if (w.id === widgetId) {
            const newLocked = !w.locked;
            return {
              ...w,
              locked: newLocked,
              pinned: newLocked ? false : w.pinned,
            };
          }
          return w;
        })
      );
      closeContextMenu();
    },
    [setWidgets, closeContextMenu]
  );

  const togglePinWidget = useCallback(
    (widgetId) => {
      setWidgets((prev) =>
        prev.map((w) => {
          if (w.id === widgetId) {
            const newPinned = !w.pinned;
            return {
              ...w,
              pinned: newPinned,
              locked: newPinned ? false : w.locked,
            };
          }
          return w;
        })
      );
      closeContextMenu();
    },
    [setWidgets, closeContextMenu]
  );

  const removeWidget = useCallback(
    (widgetId) => {
      setWidgets((prev) => prev.filter((w) => w.id !== widgetId));
      closeContextMenu();
    },
    [setWidgets, closeContextMenu]
  );

  const addWidget = useCallback(
    (widgetType, x, y) => {
      const Component = componentMap[widgetType];
      if (!Component) {
        console.warn(`Widget type ${widgetType} not found`);
        return;
      }

      flushSync(() => {
        setWidgets((prev) => {
          const allowsMultipleInstances = widgetType === "block";

          if (!allowsMultipleInstances) {
            const existingWidget = prev.find(
              (w) => w.type === widgetType || w.id === widgetType
            );
            if (existingWidget) {
              console.warn(`Widget ${widgetType} already exists`);
              return prev;
            }
          }

          let widgetId = widgetType;
          if (allowsMultipleInstances) {
            const existingWidgets = prev.filter((w) => w.type === widgetType);
            let maxNumber = 0;
            existingWidgets.forEach((w) => {
              const match = w.id.match(new RegExp(`^${widgetType}-(\\d+)$`));
              if (match) {
                const num = parseInt(match[1], 10);
                if (num > maxNumber) {
                  maxNumber = num;
                }
              }
            });
            widgetId = `${widgetType}-${maxNumber + 1}`;
          }

          const minSize = getWidgetMinSize(widgetType);
          const width = snapSizeToGrid(minSize.width);
          const height = snapSizeToGrid(minSize.height);

          let targetX = x;
          let targetY = y;
          if (
            x < 0 ||
            x > window.innerWidth ||
            y < 0 ||
            y > window.innerHeight
          ) {
            if (prev.length > 0) {
              const rightmostWidget = prev.reduce((rightmost, w) =>
                w.x + w.width > rightmost.x + rightmost.width ? w : rightmost
              );
              targetX = rightmostWidget.x + rightmostWidget.width + GRID_SIZE;
              targetY = rightmostWidget.y;
            } else {
              targetX = snapToGrid(100, GRID_OFFSET_X);
              targetY = snapToGrid(100, GRID_OFFSET_Y);
            }
          }

          const snappedX = snapToGrid(targetX, GRID_OFFSET_X);
          const snappedY = snapToGrid(targetY, GRID_OFFSET_Y);
          const constrained = constrainToViewport(
            snappedX,
            snappedY,
            width,
            height,
            centerOffset
          );

          const validPosition = findNearestValidPosition(
            constrained.x,
            constrained.y,
            width,
            height,
            prev,
            null
          );

          const newWidget = {
            id: widgetId,
            type: widgetType,
            x: validPosition.x,
            y: validPosition.y,
            width: width,
            height: height,
            component: Component,
            locked: false,
            pinned: false,
            settings: {},
          };

          return [...prev, newWidget];
        });
      });

      setTimeout(() => {
        animateWidgetsIn();
      }, 50);

      closeContextMenu();
    },
    [setWidgets, closeContextMenu, animateWidgetsIn, centerOffset]
  );

  const copyLayout = useCallback(() => {
    const layoutToSave = widgets.map(
      ({ id, type, x, y, width, height, col, row, w, h, locked, pinned }) => {
        const grid =
          typeof col === "number" && typeof row === "number"
            ? { col, row, w, h }
            : pixelsToGrid({ x, y, width, height });
        return {
          id,
          type,
          col: grid.col,
          row: grid.row,
          w: grid.w,
          h: grid.h,
          locked: locked || false,
          pinned: pinned || false,
          settings: {},
        };
      }
    );
    const exportName = isMobile()
      ? "TEMPLATE_PAGE_LAYOUT_MOBILE"
      : "TEMPLATE_PAGE_LAYOUT";
    const snippet = `export const ${exportName} = ${JSON.stringify(
      layoutToSave,
      null,
      2
    )};`;

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard
        .writeText(snippet)
        .then(() =>
          showToast(`Copied ${isMobile() ? "mobile " : ""}layout snippet!`)
        )
        .catch(() => {
          console.log(snippet);
          showToast("Clipboard blocked. Layout snippet logged to console.");
        });
    } else {
      console.log(snippet);
      showToast("Clipboard unavailable. Layout snippet logged to console.");
    }
  }, [widgets, showToast]);

  const handleMouseDownWithContext = (e, id) => {
    if (e.button !== 2) {
      handleMouseDown(e, id);
    }
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    const target = e.target;
    let widgetElement = target.closest("[data-widget-id]");
    if (!widgetElement) {
      widgetElement = target.closest(".widget");
    }
    const widgetId = widgetElement?.getAttribute("data-widget-id") || null;
    openContextMenu(e, widgetId);
  };

  useEffect(() => {
    const handleGlobalMove = (e) => handleMouseMove(e);
    const handleGlobalUp = () => handleMouseUp();

    document.addEventListener("mousemove", handleGlobalMove);
    document.addEventListener("mouseup", handleGlobalUp);

    return () => {
      document.removeEventListener("mousemove", handleGlobalMove);
      document.removeEventListener("mouseup", handleGlobalUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  useEffect(() => {
    if (isInitialMountRef.current && widgets.length > 0) {
      isInitialMountRef.current = false;
      animateInitial();
    }
  }, [widgets, animateInitial]);

  useEffect(() => {
    const previousMobile = previousMobileStateRef.current;
    if (previousMobile === isMobileState) {
      return;
    }

    previousMobileStateRef.current = isMobileState;
    const layoutToUse = getTemplateLayout(isMobileState);

    if (layoutToUse && Array.isArray(layoutToUse) && layoutToUse.length > 0) {
      const rebuiltWidgets = buildWidgetsFromLayout(layoutToUse, {
        mobile: isMobileState,
      });
      flushSync(() => {
        setWidgets(rebuiltWidgets);
      });
      setTimeout(() => {
        animateWidgetsIn();
      }, 50);
    }
  }, [isMobileState, setWidgets, animateWidgetsIn]);

  const mobile = isMobile();

  return (
    <div
      style={{
        width: "100vw",
        height: mobile ? "auto" : "100vh",
        minHeight: mobile ? "100vh" : "auto",
        overflow: mobile ? "auto" : "hidden",
        overflowX: "hidden",
        position: "relative",
      }}
      onContextMenu={handleContextMenu}
    >
      <ContextMenu
        contextMenu={contextMenu}
        widgets={validWidgets}
        onToggleLock={toggleLockWidget}
        onTogglePin={togglePinWidget}
        onRemoveWidget={removeWidget}
        onSort={autosortWidgets}
        onAddWidget={addWidget}
        onCopyLayout={copyLayout}
        onClose={closeContextMenu}
        componentMap={componentMap}
      />

      <GridBackground centerOffset={centerOffset} />

      <GridMask
        widgets={widgets}
        centerOffset={centerOffset}
        isDragging={isDragging}
        isResizing={isResizing}
        dragStateRef={dragStateRef}
      />

      <WidgetContainer
        widgets={validWidgets}
        isDragging={isDragging}
        isResizing={isResizing}
        collisionWidgetId={collisionWidgetId}
        swapTargetId={swapTargetId}
        dragStateRef={dragStateRef}
        resizeStateRef={resizeStateRef}
        onMouseDown={handleMouseDownWithContext}
        wasLastInteractionDrag={wasLastInteractionDrag}
        centerOffset={centerOffset}
      />
      <Toaster toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
