// src/components/debug/DebugPanel.jsx
import PropTypes from "prop-types";
import { memo } from "react";

const HoveredNodeInfo = memo(({ node }) => (
  <div className="mt-2 p-2 bg-gray-800 rounded border border-gray-700">
    <p>Hovered Node:</p>
    <pre className="text-xs">{JSON.stringify(node, null, 2)}</pre>
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

const SelectedNodeInfo = memo(({ node }) => (
  <div className="mt-2 p-2 bg-gray-800 rounded border border-gray-700">
    <p>Selected Node:</p>
    <pre className="text-xs">{JSON.stringify(node, null, 2)}</pre>
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

const DebugPanel = memo(
  ({ debugInfo, onClose, showOverlay, onToggleOverlay }) => (
    <div className="fixed top-0 right-0 bg-gray-900/90 text-gray-200 p-4 m-4 rounded-lg shadow-lg font-mono text-sm border border-gray-700">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold">Debug Panel</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-200">
          [X]
        </button>
      </div>
      <div className="space-y-1">
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-700">
          <input
            type="checkbox"
            id="showOverlay"
            checked={showOverlay}
            onChange={onToggleOverlay}
            className="w-4 h-4 rounded border-gray-600"
          />
          <label htmlFor="showOverlay">Show Collision Overlay</label>
        </div>
        <p>Nodes: {debugInfo.nodeCount}</p>
        <p>Links: {debugInfo.linkCount}</p>
        <p>FPS: {debugInfo.fps.toFixed(1)}</p>
        <p>Visible Labels: {debugInfo.visibleLabelsCount}</p>
        <p>Total Labels: {debugInfo.totalLabels}</p>
        <p>Label-Label Collisions: {debugInfo.collidingLabels}</p>
        <p>Label-Node Collisions: {debugInfo.labelNodeCollisions}</p>
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
HoveredNodeInfo.displayName = "HoveredNodeInfo";
SelectedNodeInfo.displayName = "SelectedNodeInfo";

export default DebugPanel;
