import { useState, useEffect, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import movieNetwork from '../processed_movie_network.json';
import { QuadTree } from '../utils/QuadTree';
import DebugPanel from '../components/debug/DebugPanel';
import ShowDebugButton from '../components/debug/ShowDebugButton';

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
      const processedNodes = new Set();
  
      // Process all labels
      for (const labelRect of labelRects) {
        if (processedNodes.has(labelRect.id)) continue;
  
        const collisions = quadtree.query(labelRect);
        
        if (collisions.length === 0) {
          visibleNodes.add(labelRect.id);
          quadtree.insert(labelRect);
        } else {
          processedNodes.add(labelRect.id);
          visibleNodes.delete(labelRect.id);
          
          for (const collision of collisions) {
            processedNodes.add(collision.id);
            visibleNodes.delete(collision.id);
          }
        }
      }
  
      return visibleNodes;
    };
  }, [truncateTitle]);

  const paintNode = useMemo(() => {
    return (node, ctx, globalScale) => {
      const radius = (node.size / 2) * 0.15;
      
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = node.color;
      ctx.fill();

      if (globalScale >= 1.2 && visibleLabels.has(node.id)) {
        const label = truncateTitle(node.title);
        ctx.font = `${12 / globalScale}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        
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
        
        ctx.fillStyle = 'white';
        ctx.fillText(label, node.x, node.y + radius + 3 / globalScale);
      }
    };
  }, [truncateTitle, visibleLabels]);

  if (!graphData) {
    return (
      <div className="w-full h-screen bg-gray-900 text-gray-200 flex items-center justify-center">
        Loading...
      </div>
    );
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
      {showDebugPanel ? (
        <DebugPanel 
          debugInfo={debugInfo} 
          onClose={() => setShowDebugPanel(false)} 
        />
      ) : (
        <ShowDebugButton 
          onShow={() => setShowDebugPanel(true)} 
        />
      )}
    </div>
  );
};

export default MovieNetworkGraph;