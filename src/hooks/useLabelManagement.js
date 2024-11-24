// src/hooks/useLabelManagement.js
import { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { LabelCollisionDetector } from '../utils/LabelCollisionDetector';
import { ZOOM, LABEL } from '../constants';

/**
 * Custom hook to manage label visibility and collision detection
 * @param {number} zoomThreshold - Zoom level threshold for showing labels
 * @returns {Object} Label management methods and state
 */
export const useLabelManagement = (zoomThreshold = ZOOM.THRESHOLD) => {
  const [visibleLabels, setVisibleLabels] = useState(new Set());
  const [labelRects, setLabelRects] = useState([]);

  const truncateTitle = useCallback((title, maxLength = LABEL.FONT.MAX_LENGTH) => {
    if (title.length <= maxLength) return title;
    return title.slice(0, maxLength - 3) + '...';
  }, []);

  const updateLabelVisibility = useCallback((nodes, ctx, globalScale) => {
    if (nodes) {
      const { visibleNodes, labelRects: newLabelRects } = 
        LabelCollisionDetector.calculateLabelRects(
          nodes, 
          ctx, 
          globalScale, 
          truncateTitle,
          zoomThreshold
        );
      setVisibleLabels(visibleNodes);
      setLabelRects(newLabelRects);
      
      return {
        visibleLabelsCount: visibleNodes.size,
        totalLabels: newLabelRects.length,
        collidingLabels: newLabelRects.filter(r => r.collides).length
      };
    }
    return null;
  }, [truncateTitle, zoomThreshold]);

  return {
    visibleLabels,
    labelRects,
    truncateTitle,
    updateLabelVisibility
  };
};

useLabelManagement.propTypes = {
  zoomThreshold: PropTypes.number
};