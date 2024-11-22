import { useState, useEffect } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import movieNetwork from './processed_movie_network.json';

const MovieNetworkGraph = () => {
  const [graphData, setGraphData] = useState(null);
  const [debugInfo, setDebugInfo] = useState({
    hoveredNode: null,
    selectedNode: null,
    nodeCount: 0,
    linkCount: 0,
    fps: 0
  });
  const [showDebugPanel, setShowDebugPanel] = useState(true);

  // Initialize graph data with console logging
  useEffect(() => {
    if (!graphData && movieNetwork?.graph) {
      console.log('Initializing graph data:', {
        nodeCount: movieNetwork.graph.nodes.length,
        linkCount: movieNetwork.graph.links.length,
        metadata: movieNetwork.metadata
      });

      setGraphData({
        nodes: movieNetwork.graph.nodes,
        links: movieNetwork.graph.links
      });

      setDebugInfo(prev => ({
        ...prev,
        nodeCount: movieNetwork.graph.nodes.length,
        linkCount: movieNetwork.graph.links.length
      }));
    }
  }, [graphData]);

  // Debug Panel Component
  const DebugPanel = () => (
    <div className="fixed top-0 right-0 bg-gray-900/90 text-gray-200 p-4 m-4 rounded-lg shadow-lg font-mono text-sm border border-gray-700">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold">Debug Panel</h3>
        <button 
          onClick={() => setShowDebugPanel(false)}
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

  // Show Debug Panel Button
  const ShowDebugButton = () => (
    <button
      onClick={() => setShowDebugPanel(true)}
      className="fixed top-4 right-4 bg-gray-900/90 text-gray-200 px-4 py-2 rounded border border-gray-700"
    >
      Show Debug
    </button>
  );

  if (!graphData) {
    return <div className="w-full h-screen bg-gray-900 text-gray-200 flex items-center justify-center">
      Loading...
    </div>;
  }

  return (
    <div className="w-full h-screen bg-gray-900">
      <ForceGraph2D
        graphData={graphData}
        nodeId="id"
        nodeLabel="title"
        nodeColor="color"
        linkColor={() => 'rgba(255, 255, 255, 0.2)'}
        backgroundColor="#111827"
        onNodeHover={node => {
          setDebugInfo(prev => ({ ...prev, hoveredNode: node }));
        }}
        onNodeClick={node => {
          setDebugInfo(prev => ({ ...prev, selectedNode: node }));
          console.log('Node clicked:', node);
        }}
        onRenderFramePre={(ctx, globalScale) => {
          setDebugInfo(prev => ({
            ...prev,
            fps: ctx.constructor.name === 'CanvasRenderingContext2D' ? 60 : 0
          }));
        }}
      />
      {showDebugPanel ? <DebugPanel /> : <ShowDebugButton />}
    </div>
  );
};

export default MovieNetworkGraph;