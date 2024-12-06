// src/hooks/useLabelManagement.js
import { useCallback, useState } from "react";
import { LABEL } from "../constants";
import { LabelCollisionDetector } from "../utils/LabelCollisionDetector";

/**
 * @typedef {Object} LabelManagementState
 * @property {Set<string>} visibleLabels - Set of IDs for currently visible labels
 * @property {import('../utils/LabelCollisionDetector').LabelRect[]} labelRects - Array of label rectangles with collision info
 */

/**
 * @typedef {Object} LabelStats
 * @property {number} visibleLabelsCount - Number of currently visible labels
 * @property {number} totalLabels - Total number of labels in the graph
 * @property {number} labelNodeCollisions - Number of label-to-node collisions
 * @property {number} labelLabelCollisions - Number of label-to-label collisions
 */

/**
 * Custom hook to manage label visibility and collision detection
 * @returns {Object} Label management methods and state
 */
export const useLabelManagement = () => {
  // State for visible labels and label rectangles
  const [visibleLabels, setVisibleLabels] = useState(new Set());
  const [labelRects, setLabelRects] = useState([]);

  /**
   * Truncates a title string if it exceeds maximum length
   * @param {string} title - The title to truncate
   * @param {number} maxLength - Maximum allowed length
   * @returns {string} Truncated title
   */
  const truncateTitle = useCallback(
    (title, maxLength = LABEL.FONT.MAX_LENGTH) => {
      if (!title) return "";
      if (title.length <= maxLength) return title;
      return `${title.slice(0, maxLength - 3)}...`;
    },
    []
  );

  /**
   * Updates label visibility based on current view state
   * @param {import('../utils/LabelCollisionDetector').GraphNode[]} nodes - Array of graph nodes
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   * @param {number} globalScale - Current zoom scale
   * @returns {LabelStats|null} Updated label statistics or null if update failed
   */
  const updateLabelVisibility = useCallback((nodes, ctx, globalScale) => {
    if (!nodes || !Array.isArray(nodes) || nodes.length === 0) {
      console.warn("useLabelManagement: Invalid or empty nodes array");
      return null;
    }

    if (!ctx) {
      console.warn("useLabelManagement: Canvas context not provided");
      return null;
    }

    try {
      const {
        visibleNodes,
        labelRects: newLabelRects,
        labelNodeCollisions,
        labelLabelCollisions,
      } = LabelCollisionDetector.calculateLabelRects(nodes, ctx, globalScale);

      setVisibleLabels(visibleNodes);
      setLabelRects(newLabelRects);

      return {
        visibleLabelsCount: visibleNodes.size,
        totalLabels: newLabelRects.length,
        labelNodeCollisions,
        collidingLabels: labelLabelCollisions,
      };
    } catch (error) {
      console.error("Error updating label visibility:", error);
      return {
        visibleLabelsCount: 0,
        totalLabels: 0,
        labelNodeCollisions: 0,
        collidingLabels: 0,
      };
    }
  }, []);

  /**
   * Checks if a specific label should be visible
   * @param {string} labelId - ID of the label to check
   * @returns {boolean} True if the label should be visible
   */
  const isLabelVisible = useCallback(
    (labelId) => {
      return visibleLabels.has(labelId);
    },
    [visibleLabels]
  );

  /**
   * Gets the rectangle bounds for a specific label
   * @param {string} labelId - ID of the label
   * @returns {import('../utils/LabelCollisionDetector').LabelRect|undefined} Label rectangle if found
   */
  const getLabelRect = useCallback(
    (labelId) => {
      return labelRects.find((rect) => rect.id === labelId);
    },
    [labelRects]
  );

  /**
   * Clears all label visibility state
   */
  const resetLabelState = useCallback(() => {
    setVisibleLabels(new Set());
    setLabelRects([]);
  }, []);

  return {
    // State
    visibleLabels,
    labelRects,

    // Methods
    truncateTitle,
    updateLabelVisibility,
    isLabelVisible,
    getLabelRect,
    resetLabelState,
  };
};

export default useLabelManagement;
