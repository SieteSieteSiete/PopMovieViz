import { useState, useEffect, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import movieNetwork from './processed_movie_network.json';
import { QuadTree } from './utils/QuadTree';

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
  const [visibleLabels, setVisibleLabels] = useState(new Set());

  // Function to truncate movie titles
  const truncateTitle = (title, maxLength = 15) => {
    if (title.length <= maxLength) return title;
    return title.slice(0, maxLength - 3) + '...';
  };

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

  const checkLabelCollisions = useMemo(() => {
    return (nodes, ctx, globalScale) => {
      if (globalScale < 1.2) return new Set();

      // Find bounds of the graph
      let minX = Infinity, minY = Infinity;
      let maxX = -Infinity, maxY = -Infinity;

      // First pass: calculate all label rectangles and graph bounds
      const labelRects = nodes.map(node => {
        const label = truncateTitle(node.title);
        ctx.font = `${12 / globalScale}px Arial`;
        const textWidth = ctx.measureText(label).width;
        const padding = 2 / globalScale;
        const textHeight = 4 / globalScale;
        const radius = (node.size / 2) * 0.15;

        const rect = {
          id: node.id,
          x: node.x - textWidth / 2 - padding,
          y: node.y + radius + 2 / globalScale,
          width: textWidth + padding * 2,
          height: textHeight + padding * 2
        };

        minX = Math.min(minX, rect.x);
        minY = Math.min(minY, rect.y);
        maxX = Math.max(maxX, rect.x + rect.width);
        maxY = Math.max(maxY, rect.y + rect.height);

        return rect;
      });

      // Create quadtree with graph bounds
      const bounds = {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
      };
      
      const quadtree = new QuadTree(bounds);
      const visibleNodes = new Set();

      // Process labels in order
      for (const labelRect of labelRects) {
        const collisions = quadtree.query(labelRect);
        
        if (collisions.length === 0) {
          visibleNodes.add(labelRect.id);
          quadtree.insert(labelRect);
        }
      }

      return visibleNodes;
    };
  }, [truncateTitle]);

  // Custom node painting function
  const paintNode = useMemo(() => {
    return (node, ctx, globalScale) => {
      // Scale node size - divide by 2 to get radius and then apply a scaling factor
      const radius = (node.size / 2) * 0.15;
      
      // Draw node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = node.color;
      ctx.fill();

      // Only draw label if it's in the visible set and zoomed in enough
      if (globalScale >= 1.2 && visibleLabels.has(node.id)) {
        const label = truncateTitle(node.title);
        ctx.font = `${12 / globalScale}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        
        // Add a background for better readability
        const textWidth = ctx.measureText(label).width;
        const padding = 2 / globalScale;
        const textHeight = 4 / globalScale;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(
          node.x - textWidth / 2 - padding,
          node.y + radius + 2 / globalScale,
          textWidth + padding * 2,
          textHeight + padding * 2
        );
        
        // Draw the text
        ctx.fillStyle = 'white';
        ctx.fillText(label, node.x, node.y + radius + 3 / globalScale);
      }
    };
  }, [truncateTitle, visibleLabels]); // Add visibleLabels to dependencies

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
        nodeCanvasObject={paintNode}
        nodeCanvasObjectMode={() => 'replace'}
        onNodeHover={node => {
          setDebugInfo(prev => ({ ...prev, hoveredNode: node }));
        }}
        onNodeClick={node => {
          setDebugInfo(prev => ({ ...prev, selectedNode: node }));
          console.log('Node clicked:', node);
        }}
        onRenderFramePre={(ctx, globalScale) => {
          // Update visible labels on each frame
          if (graphData) {
            const visible = checkLabelCollisions(graphData.nodes, ctx, globalScale);
            setVisibleLabels(visible);
          }
          
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