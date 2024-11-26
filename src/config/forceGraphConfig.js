// src/config/forceGraphConfig.js
import PropTypes from 'prop-types';
import { COLORS, NODE, ZOOM } from '../constants';

/**
 * @typedef {Object} GraphNode
 * @property {string} id - Unique identifier for the node
 * @property {string} title - Movie title
 * @property {string} year - Release year
 * @property {number} popularity - Movie popularity score
 * @property {number} size - Node size value
 * @property {string} color - Node color
 */

/**
 * Creates the configuration object for ForceGraph2D component
 * @param {Object} params - Configuration parameters
 * @param {Function} params.paintNode - Node painting function
 * @param {Function} params.onNodeHover - Node hover handler
 * @param {Function} params.onNodeClick - Node click handler
 * @param {Function} params.onRenderFramePre - Pre-render frame handler
 * @returns {Object} ForceGraph2D configuration object
 */
export const createForceGraphConfig = ({
  paintNode,
  onNodeHover,
  onNodeClick,
  onRenderFramePre
}) => ({
  nodeId: "id",
  nodeLabel: "title",
  nodeColor: "color",
  linkColor: () => COLORS.LINK,
  backgroundColor: COLORS.BACKGROUND,
  nodeCanvasObject: paintNode,
  nodeCanvasObjectMode: () => 'replace',
  onNodeHover,
  onNodeClick,
  onRenderFramePre,
  // Additional force graph parameters
  minZoom: ZOOM.MIN_SCALE,
  maxZoom: ZOOM.MAX_SCALE,
  nodeRelSize: NODE.SIZE_SCALE * 10, // Adjust base node size
  linkWidth: 1,
  linkOpacity: 0.2,
  dagMode: null, // Disable hierarchical layout
  dagLevelDistance: 50,
  d3AlphaDecay: 0.02, // Controls how quickly the simulation cools down
  d3VelocityDecay: 0.3, // Controls how quickly nodes stop moving
  warmupTicks: 100, // Number of ticks to run before starting to render
  cooldownTicks: 50, // Number of ticks to run after warmup before stopping
  cooldownTime: 15000, // Max milliseconds to run simulations
});

export const forceGraphConfigPropTypes = {
  paintNode: PropTypes.func.isRequired,
  onNodeHover: PropTypes.func.isRequired,
  onNodeClick: PropTypes.func.isRequired,
  onRenderFramePre: PropTypes.func.isRequired,
};