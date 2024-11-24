// src/hooks/useGraphData.js
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * @typedef {Object} GraphNode
 * @property {string} id
 * @property {string} title
 * @property {string} year
 * @property {number} popularity
 * @property {number} size
 * @property {string} color
 */

/**
 * @typedef {Object} GraphLink
 * @property {string} source
 * @property {string} target
 * @property {string[]} actors
 * @property {number} value
 * @property {number} weight
 */

/**
 * @typedef {Object} GraphData
 * @property {GraphNode[]} nodes
 * @property {GraphLink[]} links
 */

/**
 * Custom hook to manage graph data loading and state
 * @param {Object} initialData - Initial graph data
 * @returns {[GraphData, Function]} Graph data and setter
 */
export const useGraphData = (initialData) => {
  const [graphData, setGraphData] = useState(null);

  useEffect(() => {
    if (!graphData && initialData?.graph) {
      setGraphData({
        nodes: initialData.graph.nodes,
        links: initialData.graph.links
      });
    }
  }, [graphData, initialData]);

  return [graphData, setGraphData];
};

useGraphData.propTypes = {
  initialData: PropTypes.shape({
    graph: PropTypes.shape({
      nodes: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string.isRequired,
        title: PropTypes.string.isRequired,
        year: PropTypes.string,
        popularity: PropTypes.number.isRequired,
        size: PropTypes.number.isRequired,
        color: PropTypes.string.isRequired
      })).isRequired,
      links: PropTypes.arrayOf(PropTypes.shape({
        source: PropTypes.string.isRequired,
        target: PropTypes.string.isRequired,
        actors: PropTypes.arrayOf(PropTypes.string).isRequired,
        value: PropTypes.number.isRequired,
        weight: PropTypes.number.isRequired
      })).isRequired
    }).isRequired
  })
};