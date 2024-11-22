import { useState, useCallback, useEffect } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import movieNetwork from './processed_movie_network.json';

const MovieNetworkGraph = () => {
  const [graphData, setGraphData] = useState(null);
  
  // Initialize graph data
  useEffect(() => {
    if (!graphData && movieNetwork?.graph) {
      const nodes = movieNetwork.graph.nodes.map(node => ({
        ...node,
        degree: movieNetwork.graph.links.filter(
          link => link.source === node.id || link.target === node.id
        ).length
      }));
      
      setGraphData({
        nodes,
        links: movieNetwork.graph.links
      });
    }
  }, [graphData]);

  const getNodeSize = useCallback((node) => {
    const baseSize = Math.max(10, node.size / 2);
    const connectionBonus = Math.log(node.degree + 1) * 3;
    return baseSize + connectionBonus;
  }, []);

  if (!graphData) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ForceGraph2D
        graphData={graphData}
        nodeId="id"
        nodeVal={getNodeSize}
        nodeLabel={node => `${node.title} (${node.year})`}
        nodeColor={node => node.color}
        nodeCanvasObject={(node, ctx, globalScale) => {
          // Draw node circle
          const size = getNodeSize(node);
          ctx.beginPath();
          ctx.arc(node.x, node.y, size, 0, 2 * Math.PI);
          ctx.fillStyle = node.color;
          ctx.fill();

          // Draw label
          const label = node.title;
          const fontSize = 12/globalScale;
          ctx.font = `${fontSize}px Sans-Serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = 'white';
          ctx.fillText(label, node.x, node.y);
        }}
        nodeCanvasObjectMode={() => 'replace'}
      />
    </div>
  );
};

export default MovieNetworkGraph;