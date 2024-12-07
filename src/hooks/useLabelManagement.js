// src/hooks/useLabelManagement.js
import { useCallback, useEffect, useRef, useState } from "react";
import { LABEL } from "../constants";

export const useLabelManagement = () => {
  const [visibleLabels, setVisibleLabels] = useState(new Set());
  const [labelRects, setLabelRects] = useState([]);
  const workerRef = useRef(null);

  // Initialize worker
  useEffect(() => {
    workerRef.current = new Worker(
      new URL("../workers/labelCollisionWorker.js", import.meta.url),
      { type: "module" }
    );

    workerRef.current.onmessage = (e) => {
      const {
        visibleNodes,
        labelRects,
        labelNodeCollisions,
        labelLabelCollisions,
      } = e.data;
      setVisibleLabels(new Set(visibleNodes));
      setLabelRects(labelRects);

      return {
        visibleLabelsCount: visibleNodes.length,
        totalLabels: labelRects.length,
        labelNodeCollisions,
        labelLabelCollisions,
      };
    };

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  const truncateTitle = useCallback(
    (title, maxLength = LABEL.FONT.MAX_LENGTH) => {
      if (!title) return "";
      if (title.length <= maxLength) return title;
      return `${title.slice(0, maxLength - 3)}...`;
    },
    []
  );

  const updateLabelVisibility = useCallback((nodes, ctx, globalScale) => {
    if (!nodes || !Array.isArray(nodes) || nodes.length === 0 || !ctx) {
      console.warn("useLabelManagement: Invalid parameters");
      return null;
    }

    try {
      // Send data to worker
      workerRef.current?.postMessage({
        nodes,
        globalScale,
        canvasWidth: ctx.canvas.width,
        canvasHeight: ctx.canvas.height,
      });
    } catch (error) {
      console.error("Error updating label visibility:", error);
      return {
        visibleLabelsCount: 0,
        totalLabels: 0,
        labelNodeCollisions: 0,
        labelLabelCollisions: 0,
      };
    }
  }, []);

  const isLabelVisible = useCallback(
    (labelId) => visibleLabels.has(labelId),
    [visibleLabels]
  );

  const getLabelRect = useCallback(
    (labelId) => labelRects.find((rect) => rect.id === labelId),
    [labelRects]
  );

  const resetLabelState = useCallback(() => {
    setVisibleLabels(new Set());
    setLabelRects([]);
  }, []);

  return {
    visibleLabels,
    labelRects,
    truncateTitle,
    updateLabelVisibility,
    isLabelVisible,
    getLabelRect,
    resetLabelState,
  };
};

export default useLabelManagement;
