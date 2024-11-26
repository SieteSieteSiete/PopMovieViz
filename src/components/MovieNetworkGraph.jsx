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
import { createForceGraphConfig } from '../config/forceGraphConfig';
import { ZOOM, COLORS, LABEL, NODE, DEBUG } from '../constants';

const MovieNetworkGraph = ({ initialShowDebug = DEBUG.INITIAL_SHOW_PANEL }) => {
  const [graphData, setGraphData] = useGraphData(movieNetwork);
  const [debugInfo, updateDebugInfo] = useDebugInfo({
    nodeCount: movieNetwork?.graph?.nodes?.length || 0,
    linkCount: movieNetwork?.graph?.links?.length || 0
  });
  const [showDebugPanel, setShowDebugPanel] = useState(initialShowDebug);
  const [showDebugOverlay, setShowDebugOverlay] = useState(DEBUG.INITIAL_SHOW_OVERLAY);
  
  const {
    visibleLabels,
    labelRects,
    truncateTitle,
    updateLabelVisibility
  } = useLabelManagement(ZOOM.THRESHOLD);

  // Node painting function
  const paintNode = useMemo(() => {
    return (node, ctx, globalScale) => {
      const radius = (node.size / 2) * NODE.SIZE_SCALE;
      
      // Draw node
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = node.color;
      ctx.fill();

      // Draw label if visible and zoomed in enough
      if (globalScale >= ZOOM.THRESHOLD && visibleLabels.has(node.id)) {
        const label = truncateTitle(node.title);
        ctx.font = `${LABEL.FONT.SIZE / globalScale}px ${LABEL.FONT.FAMILY}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        
        const textWidth = ctx.measureText(label).width;
        const padding = LABEL.PADDING / globalScale;
        const textHeight = LABEL.HEIGHT / globalScale;
        
        ctx.fillStyle = COLORS.LABEL_BACKGROUND;
        ctx.fillRect(
          node.x - textWidth / 2 - padding,
          node.y + radius + LABEL.VERTICAL_OFFSET / globalScale,
          textWidth + padding * 2,
          textHeight + padding * 2
        );
        
        ctx.fillStyle = COLORS.LABEL_TEXT;
        ctx.fillText(
          label, 
          node.x, 
          node.y + radius + (LABEL.VERTICAL_OFFSET + 1) / globalScale
        );
      }

      // Draw debug overlay
      if (showDebugPanel && showDebugOverlay && globalScale >= ZOOM.THRESHOLD) {
        const rect = labelRects.find(r => r.id === node.id);
        if (rect) {
          ctx.strokeStyle = rect.collides 
            ? COLORS.DEBUG_COLLISION.COLLIDING 
            : COLORS.DEBUG_COLLISION.NOT_COLLIDING;
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

  const graphConfig = useMemo(() => createForceGraphConfig({
    paintNode,
    onNodeHover: node => {
      updateDebugInfo({ hoveredNode: node });
    },
    onNodeClick: node => {
      updateDebugInfo({ selectedNode: node });
    },
    onRenderFramePre: (ctx, globalScale) => {
      if (graphData) {
        const labelStats = updateLabelVisibility(graphData.nodes, ctx, globalScale);
        if (labelStats) {
          updateDebugInfo({
            ...labelStats,
            fps: ctx.constructor.name === 'CanvasRenderingContext2D' ? 60 : 0
          });
        }
      }
    }
  }), [paintNode, graphData, updateDebugInfo, updateLabelVisibility]);

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
        {...graphConfig}
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