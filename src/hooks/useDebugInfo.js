// src/hooks/useDebugInfo.js
import { useState } from 'react';
import PropTypes from 'prop-types';

/**
 * @typedef {Object} DebugInfo
 * @property {Object|null} hoveredNode
 * @property {Object|null} selectedNode
 * @property {number} nodeCount
 * @property {number} linkCount
 * @property {number} fps
 * @property {number} visibleLabelsCount
 * @property {number} totalLabels
 * @property {number} collidingLabels
 */

/**
 * Custom hook to manage debug information state
 * @param {Object} initialDebugInfo - Initial debug info
 * @returns {[DebugInfo, Function]} Debug info and setter
 */
export const useDebugInfo = (initialDebugInfo = {}) => {
  const [debugInfo, setDebugInfo] = useState({
    hoveredNode: null,
    selectedNode: null,
    nodeCount: 0,
    linkCount: 0,
    fps: 0,
    visibleLabelsCount: 0,
    totalLabels: 0,
    collidingLabels: 0,
    ...initialDebugInfo
  });

  const updateDebugInfo = (updates) => {
    setDebugInfo(prev => ({
      ...prev,
      ...updates
    }));
  };

  return [debugInfo, updateDebugInfo];
};

useDebugInfo.propTypes = {
  initialDebugInfo: PropTypes.shape({
    hoveredNode: PropTypes.object,
    selectedNode: PropTypes.object,
    nodeCount: PropTypes.number,
    linkCount: PropTypes.number,
    fps: PropTypes.number,
    visibleLabelsCount: PropTypes.number,
    totalLabels: PropTypes.number,
    collidingLabels: PropTypes.number
  })
};