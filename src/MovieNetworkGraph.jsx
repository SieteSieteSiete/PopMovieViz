import { useState, useCallback, useEffect } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import movieNetwork from './processed_movie_network.json';

const MovieNetworkGraph = () => {
  const [graphData, setGraphData] = useState(null);
  const [dimensions, setDimensions] = useState({
    width: 800,
    height: 600
  });
  const [highlightNodes, setHighlightNodes] = useState(new Set());
  const [highlightLinks, setHighlightLinks] = useState(new Set());
  const [hoverNode, setHoverNode] = useState(null);

  // Initialize graph data
  useEffect(() => {
    if (!graphData && movieNetwork?.graph) {
      // Add degree (number of connections) to each node
      const nodes = movieNetwork.graph.nodes.map(node => {
        const degree = movieNetwork.graph.links.filter(
          link => link.source === node.id || link.target === node.id
        ).length;
        return { ...node, degree };
      });
      
      setGraphData({
        nodes,
        links: movieNetwork.graph.links
      });
    }
  }, [graphData]);

  // Handle window resize
  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: Math.max(window.innerWidth - 100, 800),
        height: Math.max(window.innerHeight - 100, 600)
      });
    };

    window.addEventListener('resize', updateDimensions);
    updateDimensions();

    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const updateHighlight = () => {
    setHighlightNodes(new Set(hoverNode ? [hoverNode] : []));
    setHighlightLinks(new Set());

    if (hoverNode && graphData) {
      graphData.links.forEach(link => {
        if (link.source.id === hoverNode.id || link.target.id === hoverNode.id) {
          setHighlightLinks(prev => new Set([...prev, link]));
          setHighlightNodes(prev => new Set([...prev, link.source, link.target]));
        }
      });
    }
  };

  const handleNodeHover = node => {
    setHoverNode(node || null);
    updateHighlight();
  };

  const getNodeColor = useCallback(node => {
    if (!node) return '#ccc';
    if (highlightNodes.has(node)) {
      return node.color === '#ff7f0e' ? '#ff4500' : '#4169e1';
    }
    return node.color;
  }, [highlightNodes]);

  const getLinkColor = useCallback(link => {
    return highlightLinks.has(link) ? '#ff6347' : '#999999';
  }, [highlightLinks]);

  const getLinkWidth = useCallback(link => {
    return highlightLinks.has(link) ? 3 : 1.5; // Increased link width
  }, [highlightLinks]);

  // Calculate node size based on movie popularity and connections
  const getNodeSize = useCallback((node) => {
    // Base size from popularity (normalized)
    const baseSize = Math.max(10, node.size / 2);
    // Additional size based on connections
    const connectionBonus = Math.log(node.degree + 1) * 3;
    return baseSize + connectionBonus;
  }, []);

  // Calculate link distance based on number of connections
  const getLinkDistance = useCallback((link) => {
    const sourceNode = graphData?.nodes.find(n => n.id === link.source.id);
    const targetNode = graphData?.nodes.find(n => n.id === link.target.id);
    if (!sourceNode || !targetNode) return 150; // Increased base distance

    // Increase distance for nodes with more connections
    const baseDistance = 150;
    const connectionFactor = Math.max(sourceNode.degree, targetNode.degree);
    return baseDistance * (1 + Math.log(connectionFactor) / 1.5);
  }, [graphData]);

  // Show loading state if data isn't ready
  if (!graphData) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <p className="text-xl">Loading movie network data...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex flex-col items-center p-4">
      <h1 className="text-2xl font-bold mb-4">Movie Network Visualization</h1>
      <div className="relative w-full h-full border rounded-lg shadow-lg bg-white">
        <ForceGraph2D
          graphData={graphData}
          width={dimensions.width}
          height={dimensions.height}
          nodeId="id"
          nodeVal={getNodeSize}
          nodeLabel={node => `${node.title} (${node.year})\nConnections: ${node.degree}`}
          nodeColor={getNodeColor}
          linkColor={getLinkColor}
          linkWidth={getLinkWidth}
          linkLabel={link => `Shared Actors: ${link.actors.join(', ')}`}
          onNodeHover={handleNodeHover}
          linkDirectionalParticles={4}
          linkDirectionalParticleWidth={2}
          nodeCanvasObjectMode={() => 'after'}
          nodeCanvasObject={(node, ctx, globalScale) => {
            const label = node.title;
            const fontSize = 14/globalScale; // Slightly larger font
            ctx.font = `${fontSize}px Sans-Serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = highlightNodes.has(node) ? '#fff' : 'rgba(255,255,255,0.8)';
            // Position label slightly lower to account for larger nodes
            ctx.fillText(label, node.x, node.y + getNodeSize(node) / 2 + 2);
          }}
          cooldownTicks={100}
          d3VelocityDecay={0.3}
          d3AlphaMin={0.01}
          linkDistance={getLinkDistance}
          dagMode={null}
          dagLevelDistance={null}
          // Enhanced force parameters
          d3Force={(d3Force) => {
            // Stronger repulsive force between nodes
            d3Force.charge()
              .strength(node => -150 * (1 + node.degree / 2)) // Increased base strength
              .distanceMax(300); // Increased max distance

            // Stronger collision force to prevent overlap of larger nodes
            d3Force.collision()
              .radius(node => getNodeSize(node) * 1.5) // Increased collision radius
              .strength(1); // Maximum collision strength

            // Adjusted link force for larger nodes
            d3Force.link()
              .distance(getLinkDistance)
              .strength(link => 1 / Math.sqrt(
                link.source.degree * link.target.degree
              ));

            // Center force to keep the graph centered
            d3Force.center()
              .strength(0.05); // Gentle centering force
          }}
        />
      </div>
      <div className="mt-4 text-sm text-gray-600">
        <p>Hover over nodes to see connections. Blue nodes are older movies, orange nodes are 2024 releases.</p>
      </div>
    </div>
  );
};

export default MovieNetworkGraph;