// src/components/MovieNetworkGraph.jsx
import { useState, useMemo, useCallback, memo, useEffect } from 'react';
import PropTypes from 'prop-types';
import ForceGraph2D from 'react-force-graph-2d';
import movieNetwork from '../data/processed_movie_network.json';
import DebugPanel from './debug/DebugPanel';
import ShowDebugButton from './debug/ShowDebugButton';
import ErrorBoundary from './ErrorBoundary';
import LoadingState from './common/LoadingState';
import ErrorDisplay from './common/ErrorDisplay';
import { useGraphData } from '../hooks/useGraphData';
import { useDebugInfo } from '../hooks/useDebugInfo';
import { useLabelManagement } from '../hooks/useLabelManagement';
import { createForceGraphConfig } from '../config/forceGraphConfig';
import { ZOOM, COLORS, LABEL, NODE, DEBUG } from '../constants';
import { wrapText } from '../utils/textWrapper';

const GraphVisualization = memo(({ 
  graphData, 
  debugInfo, 
  showDebugPanel, 
  showDebugOverlay, 
  isProcessing,
  ...props 
}) => {
  if (isProcessing) {
    return <LoadingState type="processing" />;
  }

  return (
    <>
      <ForceGraph2D
        graphData={graphData}
        {...props}
      />
      {showDebugPanel ? (
        <DebugPanel 
          debugInfo={debugInfo} 
          onClose={props.onCloseDebug}
          showOverlay={showDebugOverlay}
          onToggleOverlay={props.onToggleOverlay}
        />
      ) : (
        <ShowDebugButton 
          onShow={props.onShowDebug}
        />
      )}
    </>
  );
});

GraphVisualization.displayName = 'GraphVisualization';

GraphVisualization.propTypes = {
  graphData: PropTypes.object,
  debugInfo: PropTypes.object.isRequired,
  showDebugPanel: PropTypes.bool.isRequired,
  showDebugOverlay: PropTypes.bool.isRequired,
  isProcessing: PropTypes.bool.isRequired,
  onCloseDebug: PropTypes.func.isRequired,
  onShowDebug: PropTypes.func.isRequired,
  onToggleOverlay: PropTypes.func.isRequired,
};

const MovieNetworkGraph = ({ initialShowDebug = DEBUG.INITIAL_SHOW_PANEL }) => {
  const [graphData, setGraphData, loading, error] = useGraphData(movieNetwork);
  const [debugInfo, updateDebugInfo] = useDebugInfo({
    nodeCount: movieNetwork?.graph?.nodes?.length || 0,
    linkCount: movieNetwork?.graph?.links?.length || 0
  });
  
  const [showDebugPanel, setShowDebugPanel] = useState(initialShowDebug);
  const [showDebugOverlay, setShowDebugOverlay] = useState(DEBUG.INITIAL_SHOW_OVERLAY);
  const [isProcessing, setIsProcessing] = useState(false);
  const [renderError, setRenderError] = useState(null);
  
  const {
    visibleLabels,
    labelRects,
    truncateTitle,
    updateLabelVisibility
  } = useLabelManagement(ZOOM.THRESHOLD);

  const handleReset = useCallback(() => {
    setGraphData(null);
    setShowDebugPanel(initialShowDebug);
    setShowDebugOverlay(DEBUG.INITIAL_SHOW_OVERLAY);
    setRenderError(null);
    setIsProcessing(true);
    
    // Simulate processing time for demonstration
    setTimeout(() => {
    setGraphData({
      nodes: movieNetwork.graph.nodes,
      links: movieNetwork.graph.links
    });
      setIsProcessing(false);
    }, 1000);
  }, [initialShowDebug, setGraphData]);

  const handleNodeHover = useCallback(node => {
    updateDebugInfo({ hoveredNode: node });
  }, [updateDebugInfo]);

  const handleNodeClick = useCallback(node => {
    updateDebugInfo({ selectedNode: node });
  }, [updateDebugInfo]);

  const handleRenderFramePre = useCallback((ctx, globalScale) => {
    if (graphData) {
      const labelStats = updateLabelVisibility(graphData.nodes, ctx, globalScale);
      if (labelStats) {
        updateDebugInfo({
          ...labelStats,
          fps: ctx.constructor.name === 'CanvasRenderingContext2D' ? 60 : 0
        });
      }
    }
  }, [graphData, updateLabelVisibility, updateDebugInfo]);

  const handleCloseDebug = useCallback(() => setShowDebugPanel(false), []);
  const handleShowDebug = useCallback(() => setShowDebugPanel(true), []);
  const handleToggleOverlay = useCallback(() => setShowDebugOverlay(prev => !prev), []);

  // Memoize paintNode function
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
        const fontSize = LABEL.FONT.SIZE / globalScale;
        const lineHeight = LABEL.FONT.LINE_HEIGHT / globalScale;
        const hPadding = LABEL.PADDING.HORIZONTAL / globalScale;
        const topPadding = LABEL.PADDING.TOP / globalScale;
        const bottomPadding = LABEL.PADDING.BOTTOM / globalScale;
        
        ctx.font = `${fontSize}px ${LABEL.FONT.FAMILY}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        
        // Get wrapped lines
        const scaledMaxWidth = LABEL.MAX_WIDTH / globalScale;
        const lines = wrapText(ctx, node.title, scaledMaxWidth);
        
        // Calculate dimensions with separate padding values
        const totalHeight = (lines.length * lineHeight) + topPadding + bottomPadding;
        const maxLineWidth = Math.max(...lines.map(line => ctx.measureText(line).width));
        const totalWidth = maxLineWidth + (hPadding * 2);
        
        // Draw background
        const bgX = node.x - totalWidth / 2;
        const bgY = node.y + radius + LABEL.VERTICAL_OFFSET / globalScale;
        
        ctx.fillStyle = COLORS.LABEL_BACKGROUND;
        ctx.fillRect(
          bgX,
          bgY,
          totalWidth,
          totalHeight
        );
        
        // Draw text lines with top padding
        ctx.fillStyle = COLORS.LABEL_TEXT;
        lines.forEach((line, index) => {
          const y = bgY + topPadding + (index * lineHeight);
          ctx.fillText(line, node.x, y);
        });
      }

      // Debug overlay section remains the same
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
  }, [visibleLabels, showDebugPanel, showDebugOverlay, labelRects]);

  const graphConfig = useMemo(() => createForceGraphConfig({
    paintNode,
    onNodeHover: handleNodeHover,
    onNodeClick: handleNodeClick,
    onRenderFramePre: handleRenderFramePre
  }), [paintNode, handleNodeHover, handleNodeClick, handleRenderFramePre]);

  if (loading) {
    return <LoadingState type="initial" />;
  }

  if (error) {
    return (
      <ErrorDisplay
        title="Failed to Load Data"
        message="Unable to load the movie network data. Please try again."
        error={error}
        onRetry={handleReset}
        showDetails={process.env.NODE_ENV === 'development'}
      />
    );
  }

  if (renderError) {
    return (
      <ErrorDisplay
        title="Visualization Error"
        message="There was an error rendering the movie network visualization."
        error={renderError}
        onRetry={handleReset}
        showDetails={process.env.NODE_ENV === 'development'}
      />
    );
  }

  return (
    <div className="w-full h-screen bg-gray-900">
      <ErrorBoundary
        title="Visualization Error"
        message="There was an error rendering the movie network visualization"
        onReset={handleReset}
      >
        <GraphVisualization
          graphData={graphData}
          debugInfo={debugInfo}
          showDebugPanel={showDebugPanel}
          showDebugOverlay={showDebugOverlay}
          isProcessing={isProcessing}
          onCloseDebug={handleCloseDebug}
          onShowDebug={handleShowDebug}
          onToggleOverlay={handleToggleOverlay}
          {...graphConfig}
        />
      </ErrorBoundary>
    </div>
  );
};

MovieNetworkGraph.propTypes = {
  initialShowDebug: PropTypes.bool,
};

export default MovieNetworkGraph;