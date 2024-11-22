import { useState, useEffect } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import movieNetwork from './processed_movie_network.json';

const MovieNetworkGraph = () => {
  const [graphData, setGraphData] = useState(null);

  useEffect(() => {
    if (!graphData && movieNetwork?.graph) {
      setGraphData({
        nodes: movieNetwork.graph.nodes,
        links: movieNetwork.graph.links
      });
    }
  }, [graphData]);

  if (!graphData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="w-full h-screen">
      <ForceGraph2D
        graphData={graphData}
        nodeId="id"
        nodeLabel="title"
        nodeColor="color"
        linkColor={() => '#999'}
      />
    </div>
  );
};

export default MovieNetworkGraph;