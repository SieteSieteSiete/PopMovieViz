// src/components/MovieNetworkGraph.jsx
import PropTypes from "prop-types";
import { memo, useCallback, useMemo, useState } from "react";
import ForceGraph2D from "react-force-graph-2d";
import { createForceGraphConfig } from "../config/forceGraphConfig";
import { COLORS, DEBUG, LABEL, NODE, ZOOM } from "../constants";
import movieNetwork from "../data/processed_movie_network.json";
import { useDebugInfo } from "../hooks/useDebugInfo";
import { useGraphData } from "../hooks/useGraphData";
import { useLabelManagement } from "../hooks/useLabelManagement";
import { wrapText } from "../utils/textWrapper";
import ErrorDisplay from "./common/ErrorDisplay";
import LoadingState from "./common/LoadingState";
import DebugPanel from "./debug/DebugPanel";
import ShowDebugButton from "./debug/ShowDebugButton";
import ErrorBoundary from "./ErrorBoundary";

const GraphVisualization = memo(
  ({
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
        <ForceGraph2D graphData={graphData} {...props} />
        {showDebugPanel ? (
          <DebugPanel
            debugInfo={debugInfo}
            onClose={props.onCloseDebug}
            showOverlay={showDebugOverlay}
            onToggleOverlay={props.onToggleOverlay}
          />
        ) : (
          <ShowDebugButton onShow={props.onShowDebug} />
        )}
      </>
    );
  }
);

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

GraphVisualization.displayName = "GraphVisualization";

const MovieNetworkGraph = ({ initialShowDebug = DEBUG.INITIAL_SHOW_PANEL }) => {
  const [graphData, setGraphData, loading, error] = useGraphData(movieNetwork);
  const [debugInfo, updateDebugInfo] = useDebugInfo({
    nodeCount: movieNetwork?.graph?.nodes?.length || 0,
    linkCount: movieNetwork?.graph?.links?.length || 0,
    labelNodeCollisions: 0,
  });

  const [showDebugPanel, setShowDebugPanel] = useState(initialShowDebug);
  const [showDebugOverlay, setShowDebugOverlay] = useState(
    DEBUG.INITIAL_SHOW_OVERLAY
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [renderError, setRenderError] = useState(null);

  const { visibleLabels, labelRects, updateLabelVisibility } =
    useLabelManagement();

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
        links: movieNetwork.graph.links,
      });
      setIsProcessing(false);
    }, 1000);
  }, [initialShowDebug, setGraphData]);

  const handleNodeHover = useCallback(
    (node) => {
      updateDebugInfo({ hoveredNode: node });
    },
    [updateDebugInfo]
  );

  const handleNodeClick = useCallback(
    (node) => {
      updateDebugInfo({ selectedNode: node });
    },
    [updateDebugInfo]
  );

  const handleRenderFramePre = useCallback(
    (ctx, globalScale) => {
      if (graphData) {
        const labelStats = updateLabelVisibility(
          graphData.nodes,
          ctx,
          globalScale
        );
        if (labelStats) {
          updateDebugInfo({
            ...labelStats,
            fps: ctx.constructor.name === "CanvasRenderingContext2D" ? 60 : 0,
          });
        }
      }
    },
    [graphData, updateLabelVisibility, updateDebugInfo]
  );

  const handleCloseDebug = useCallback(() => setShowDebugPanel(false), []);
  const handleShowDebug = useCallback(() => setShowDebugPanel(true), []);
  const handleToggleOverlay = useCallback(
    () => setShowDebugOverlay((prev) => !prev),
    []
  );

  // Memoize paintNode function
  const paintNode = useMemo(() => {
    return (node, ctx, globalScale) => {
      const radius = (node.size / 2) * NODE.SIZE_SCALE;

      // Draw node
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = node.color;
      ctx.fill();

      // Draw label if visible, zoomed in enough, and no collisions
      if (globalScale >= ZOOM.THRESHOLD && visibleLabels.has(node.id)) {
        // Find the label rectangle for this node
        const labelRect = labelRects.find((rect) => rect.id === node.id);

        // Only draw the label if it's not colliding
        if (labelRect && !labelRect.collides) {
          const fontSize = LABEL.FONT.SIZE / globalScale;
          const lineHeight = LABEL.FONT.LINE_HEIGHT / globalScale;
          const verticalOffset = LABEL.VERTICAL_OFFSET / globalScale;

          ctx.font = `${fontSize}px ${LABEL.FONT.FAMILY}`;
          ctx.textAlign = "center";
          ctx.textBaseline = "top";

          // Get wrapped lines
          const scaledMaxWidth = LABEL.MAX_WIDTH / globalScale;
          const lines = wrapText(ctx, node.title, scaledMaxWidth);

          // Draw text with outline for better visibility
          ctx.strokeStyle = "rgba(0, 0, 0, 0.8)";
          ctx.lineWidth = 3 / globalScale;
          ctx.lineJoin = "round";

          lines.forEach((line, index) => {
            const y = node.y + radius + verticalOffset + index * lineHeight;
            // Draw text outline
            ctx.strokeText(line, node.x, y);
            // Draw text
            ctx.fillStyle = COLORS.LABEL_TEXT;
            ctx.fillText(line, node.x, y);
          });
        }
      }

      // Debug overlay section
      if (showDebugPanel && showDebugOverlay && globalScale >= ZOOM.THRESHOLD) {
        const rect = labelRects.find((r) => r.id === node.id);
        if (rect) {
          ctx.strokeStyle = rect.collides
            ? COLORS.DEBUG_COLLISION.COLLIDING
            : COLORS.DEBUG_COLLISION.NOT_COLLIDING;
          ctx.lineWidth = 1 / globalScale;
          ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
        }
      }
    };
  }, [visibleLabels, showDebugPanel, showDebugOverlay, labelRects]);

  // Memoize graph configuration
  const graphConfig = useMemo(
    () =>
      createForceGraphConfig({
        paintNode,
        onNodeHover: handleNodeHover,
        onNodeClick: handleNodeClick,
        onRenderFramePre: handleRenderFramePre,
      }),
    [paintNode, handleNodeHover, handleNodeClick, handleRenderFramePre]
  );

  // Handle expected states
  if (loading) {
    return <LoadingState type="initial" />;
  }

  if (error) {
    return (
      <ErrorDisplay
        title="Data Loading Error"
        message="Unable to load the movie network data"
        error={error}
        onRetry={handleReset}
        showDetails={import.meta.env.DEV}
      />
    );
  }

  if (renderError) {
    return (
      <ErrorDisplay
        title="Rendering Error"
        message="An error occurred while rendering the visualization"
        error={renderError}
        onRetry={handleReset}
        showDetails={import.meta.env.DEV}
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
