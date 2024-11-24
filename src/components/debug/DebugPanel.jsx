// src/components/debug/DebugPanel.jsx
const DebugPanel = ({ debugInfo, onClose }) => (
    <div className="fixed top-0 right-0 bg-gray-900/90 text-gray-200 p-4 m-4 rounded-lg shadow-lg font-mono text-sm border border-gray-700">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold">Debug Panel</h3>
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-gray-200"
        >
          [X]
        </button>
      </div>
      <div className="space-y-1">
        <p>Nodes: {debugInfo.nodeCount}</p>
        <p>Links: {debugInfo.linkCount}</p>
        <p>FPS: {debugInfo.fps.toFixed(1)}</p>
        {debugInfo.hoveredNode && (
          <div className="mt-2 p-2 bg-gray-800 rounded border border-gray-700">
            <p>Hovered Node:</p>
            <pre className="text-xs">
              {JSON.stringify(debugInfo.hoveredNode, null, 2)}
            </pre>
          </div>
        )}
        {debugInfo.selectedNode && (
          <div className="mt-2 p-2 bg-gray-800 rounded border border-gray-700">
            <p>Selected Node:</p>
            <pre className="text-xs">
              {JSON.stringify(debugInfo.selectedNode, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
  
  export default DebugPanel;