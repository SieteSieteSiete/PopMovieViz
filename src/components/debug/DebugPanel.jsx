// src/components/debug/DebugPanel.jsx
import PropTypes from "prop-types";
import { memo } from "react";
import { DEBUG } from "../../constants";

/**
 * Displays detailed information about a hovered node
 */
const HoveredNodeInfo = memo(({ node }) => (
  <div className="mt-2 p-2 bg-gray-800 rounded border border-gray-700">
    <p className="font-medium mb-1">Hovered Node:</p>
    <pre className="text-xs overflow-auto max-h-40">
      {JSON.stringify(node, null, 2)}
    </pre>
  </div>
));

HoveredNodeInfo.propTypes = {
  node: PropTypes.shape({
    id: PropTypes.string,
    title: PropTypes.string,
    year: PropTypes.string,
    popularity: PropTypes.number,
    size: PropTypes.number,
    color: PropTypes.string,
  }).isRequired,
};

HoveredNodeInfo.displayName = "HoveredNodeInfo";

/**
 * Displays detailed information about a selected node
 */
const SelectedNodeInfo = memo(({ node }) => (
  <div className="mt-2 p-2 bg-gray-800 rounded border border-gray-700">
    <p className="font-medium mb-1">Selected Node:</p>
    <pre className="text-xs overflow-auto max-h-40">
      {JSON.stringify(node, null, 2)}
    </pre>
  </div>
));

SelectedNodeInfo.propTypes = {
  node: PropTypes.shape({
    id: PropTypes.string,
    title: PropTypes.string,
    year: PropTypes.string,
    popularity: PropTypes.number,
    size: PropTypes.number,
    color: PropTypes.string,
  }).isRequired,
};

SelectedNodeInfo.displayName = "SelectedNodeInfo";

/**
 * Statistics section showing network metrics
 */
const NetworkStats = memo(({ stats }) => (
  <div className="space-y-1">
    <p>Nodes: {stats.nodeCount}</p>
    <p>Links: {stats.linkCount}</p>
  </div>
));

NetworkStats.propTypes = {
  stats: PropTypes.shape({
    nodeCount: PropTypes.number.isRequired,
    linkCount: PropTypes.number.isRequired,
  }).isRequired,
};

NetworkStats.displayName = "NetworkStats";

/**
 * Performance metrics section
 */
const PerformanceStats = memo(({ stats }) => (
  <div className="space-y-1">
    <p>FPS: {stats.fps.toFixed(1)}</p>
    <p>Visible Labels: {stats.visibleLabelsCount}</p>
    <p>Total Labels: {stats.totalLabels}</p>
  </div>
));

PerformanceStats.propTypes = {
  stats: PropTypes.shape({
    fps: PropTypes.number.isRequired,
    visibleLabelsCount: PropTypes.number.isRequired,
    totalLabels: PropTypes.number.isRequired,
  }).isRequired,
};

PerformanceStats.displayName = "PerformanceStats";

/**
 * Collision statistics section
 */
const CollisionStats = memo(({ stats }) => (
  <div className="space-y-1">
    <p>Label-Label Collisions: {stats.collidingLabels}</p>
    <p>Label-Node Collisions: {stats.labelNodeCollisions}</p>
  </div>
));

CollisionStats.propTypes = {
  stats: PropTypes.shape({
    collidingLabels: PropTypes.number.isRequired,
    labelNodeCollisions: PropTypes.number.isRequired,
  }).isRequired,
};

CollisionStats.displayName = "CollisionStats";

/**
 * Main debug panel component
 */
const DebugPanel = memo(
  ({ debugInfo, onClose, showOverlay, onToggleOverlay }) => (
    <div
      className={`fixed top-0 right-0 ${DEBUG.PANEL.BACKGROUND} ${DEBUG.PANEL.TEXT} p-4 m-4 rounded-lg shadow-lg font-mono text-sm ${DEBUG.PANEL.BORDER}`}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold">Debug Panel</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-200 transition-colors"
          aria-label="Close debug panel"
        >
          [X]
        </button>
      </div>

      <div className="space-y-4">
        {/* Overlay Toggle */}
        <div className="flex items-center gap-2 pb-2 border-b border-gray-700">
          <input
            type="checkbox"
            id="showOverlay"
            checked={showOverlay}
            onChange={onToggleOverlay}
            className="w-4 h-4 rounded border-gray-600"
          />
          <label htmlFor="showOverlay">Show Collision Overlay</label>
        </div>

        {/* Statistics Sections */}
        <div className="space-y-3">
          <NetworkStats stats={debugInfo} />
          <PerformanceStats stats={debugInfo} />
          <CollisionStats stats={debugInfo} />
        </div>

        {/* Node Information */}
        {debugInfo.hoveredNode && (
          <HoveredNodeInfo node={debugInfo.hoveredNode} />
        )}
        {debugInfo.selectedNode && (
          <SelectedNodeInfo node={debugInfo.selectedNode} />
        )}
      </div>
    </div>
  )
);

DebugPanel.propTypes = {
  debugInfo: PropTypes.shape({
    hoveredNode: PropTypes.shape({
      id: PropTypes.string,
      title: PropTypes.string,
      year: PropTypes.string,
      popularity: PropTypes.number,
      size: PropTypes.number,
      color: PropTypes.string,
    }),
    selectedNode: PropTypes.shape({
      id: PropTypes.string,
      title: PropTypes.string,
      year: PropTypes.string,
      popularity: PropTypes.number,
      size: PropTypes.number,
      color: PropTypes.string,
    }),
    nodeCount: PropTypes.number.isRequired,
    linkCount: PropTypes.number.isRequired,
    fps: PropTypes.number.isRequired,
    visibleLabelsCount: PropTypes.number.isRequired,
    totalLabels: PropTypes.number.isRequired,
    collidingLabels: PropTypes.number.isRequired,
    labelNodeCollisions: PropTypes.number.isRequired,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  showOverlay: PropTypes.bool.isRequired,
  onToggleOverlay: PropTypes.func.isRequired,
};

DebugPanel.displayName = "DebugPanel";

export default DebugPanel;
