// src/components/MovieNetworkGraph.jsx
import PropTypes from 'prop-types';
import { useState, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import movieNetwork from '../data/processed_movie_network.json';
import DebugPanel from './debug/DebugPanel';
import ShowDebugButton from './debug/ShowDebugButton';
import { useGraphData } from '../hooks/useGraphData';
import { useDebugInfo } from '../hooks/useDebugInfo';
import { useLabelManagement } from '../hooks/useLabelManagement';

const ZOOM_THRESHOLD = 1.5;

const MovieNetworkGraph = ({ initialShowDebug = true }) => {
  const [graphData, setGraphData] = useGraphData(movieNetwork);
  const [debugInfo, updateDebugInfo] = useDebugInfo({
    nodeCount: movieNetwork?.graph?.nodes?.length || 0,
    linkCount: movieNetwork?.graph?.links?.length || 0
  });
  const [showDebugPanel, setShowDebugPanel] = useState(initialShowDebug);
  const [showDebugOverlay, setShowDebugOverlay] = useState(true);
  
  const {
    visibleLabels,
    labelRects,
    truncateTitle,
    updateLabelVisibility
  } = useLabelManagement(ZOOM_THRESHOLD);

  // Node painting function
  const paintNode = useMemo(() => {
    return (node, ctx, globalScale) => {
      const radius = (node.size / 2) * 0.15;
      
      // Draw node
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = node.color;
      ctx.fill();

      // Draw label if visible and zoomed in enough
      if (globalScale >= ZOOM_THRESHOLD && visibleLabels.has(node.id)) {
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

      // Draw debug overlay
      if (showDebugPanel && showDebugOverlay && globalScale >= ZOOM_THRESHOLD) {
        const rect = labelRects.find(r => r.id === node.id);
        if (rect) {
          ctx.strokeStyle = rect.collides ? 'rgba(255, 0, 0, 0.5)' : 'rgba(0, 255, 0, 0.5)';
          ctx.lineWidth = 1 / globalScale;
          ctx.strokeRect(
            rect.x,
            rect.y,
            rect.width,
            rect.height
          );
        }
      }
    };
  }, [visibleLabels, showDebugPanel, showDebugOverlay, labelRects, truncateTitle]);

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
          updateDebugInfo({ hoveredNode: node });
        }}
        onNodeClick={node => {
          updateDebugInfo({ selectedNode: node });
        }}
        onRenderFramePre={(ctx, globalScale) => {
          if (graphData) {
            const labelStats = updateLabelVisibility(graphData.nodes, ctx, globalScale);
            if (labelStats) {
              updateDebugInfo({
                ...labelStats,
                fps: ctx.constructor.name === 'CanvasRenderingContext2D' ? 60 : 0
              });
            }
          }
        }}
      />
      {showDebugPanel ? (
        <DebugPanel 
          debugInfo={debugInfo} 
          onClose={() => setShowDebugPanel(false)}
          showOverlay={showDebugOverlay}
          onToggleOverlay={() => setShowDebugOverlay(!showDebugOverlay)}
        />
      ) : (
        <ShowDebugButton 
          onShow={() => setShowDebugPanel(true)} 
        />
      )}
    </div>
  );
};

MovieNetworkGraph.propTypes = {
  initialShowDebug: PropTypes.bool,
};

export default MovieNetworkGraph;