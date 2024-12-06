// src/utils/LabelCollisionDetector.js
import { LABEL, NODE, ZOOM } from "../constants";
import { QuadTree } from "./QuadTree";
import { wrapText } from "./textWrapper";

/**
 * @typedef {Object} GraphNode
 * @property {string} id - Node identifier
 * @property {string} title - Node title
 * @property {number} x - Node x position
 * @property {number} y - Node y position
 * @property {number} size - Node size
 * @property {number} [vx] - Node x velocity
 * @property {number} [vy] - Node y velocity
 */

/**
 * @typedef {Object} LabelRect
 * @property {string} id - Node identifier
 * @property {number} x - X position
 * @property {number} y - Y position
 * @property {number} width - Rectangle width
 * @property {number} height - Rectangle height
 * @property {boolean} collides - Whether this label collides with others
 * @property {GraphNode} node - Reference to the graph node
 * @property {number} centerX - Center X position
 * @property {number} centerY - Center Y position
 * @property {Object} debug - Debug information
 * @property {number} debug.lines - Number of text lines
 * @property {number} debug.textHeight - Height of text
 * @property {number} debug.topPadding - Top padding
 * @property {number} debug.bottomPadding - Bottom padding
 * @property {number} debug.totalHeight - Total height including padding
 */

/**
 * @typedef {Object} CollisionResult
 * @property {Set<string>} visibleNodes - Set of visible node IDs
 * @property {LabelRect[]} labelRects - Array of label rectangles with collision info
 * @property {number} labelNodeCollisions - Number of label-to-node collisions
 */

/**
 * Handles detection and resolution of collisions between labels and nodes
 */
export class LabelCollisionDetector {
  /**
   * Check if a label rectangle intersects with a node circle
   * @param {LabelRect} labelRect - Label rectangle bounds
   * @param {GraphNode} node - Node to check against
   * @param {number} nodeRadius - Radius of the node
   * @returns {boolean} True if there is intersection
   */
  static checkLabelNodeCollision(labelRect, node, nodeRadius) {
    if (!labelRect || !node || nodeRadius === undefined) {
      console.warn(
        "LabelCollisionDetector: Invalid parameters for collision check"
      );
      return false;
    }

    // Find closest point on rectangle to circle center
    const closestX = Math.max(
      labelRect.x,
      Math.min(node.x, labelRect.x + labelRect.width)
    );
    const closestY = Math.max(
      labelRect.y,
      Math.min(node.y, labelRect.y + labelRect.height)
    );

    // Calculate distance between closest point and circle center
    const dx = node.x - closestX;
    const dy = node.y - closestY;
    const distanceSquared = dx * dx + dy * dy;

    // Check if distance is less than circle radius
    return distanceSquared < nodeRadius * nodeRadius;
  }

  /**
   * Calculate label rectangles and handle collisions
   * @param {GraphNode[]} nodes - Array of graph nodes
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} globalScale - Current zoom scale
   * @returns {CollisionResult} Collision detection results
   */
  static calculateLabelRects(nodes, ctx, globalScale) {
    if (!nodes || !Array.isArray(nodes)) {
      console.warn("LabelCollisionDetector: Invalid nodes array provided");
      return {
        visibleNodes: new Set(),
        labelRects: [],
        labelNodeCollisions: 0,
      };
    }

    if (!ctx) {
      console.warn("LabelCollisionDetector: Canvas context not provided");
      return {
        visibleNodes: new Set(),
        labelRects: [],
        labelNodeCollisions: 0,
      };
    }

    if (globalScale < ZOOM.THRESHOLD) {
      return {
        visibleNodes: new Set(),
        labelRects: [],
        labelNodeCollisions: 0,
      };
    }

    // Find bounds of the graph
    let minX = Infinity,
      minY = Infinity;
    let maxX = -Infinity,
      maxY = -Infinity;

    // Calculate all label rectangles and graph bounds
    const labelRects = nodes.map((node) => {
      const fontSize = LABEL.FONT.SIZE / globalScale;
      const lineHeight = LABEL.FONT.LINE_HEIGHT / globalScale;
      const hPadding = LABEL.PADDING.HORIZONTAL / globalScale;
      const topPadding = LABEL.PADDING.TOP / globalScale;
      const bottomPadding = LABEL.PADDING.BOTTOM / globalScale;

      ctx.font = `${fontSize}px ${LABEL.FONT.FAMILY}`;

      // Get wrapped lines
      const maxWidth = LABEL.MAX_WIDTH / globalScale;
      const lines = wrapText(ctx, node.title, maxWidth);

      const radius = (node.size / 2) * NODE.SIZE_SCALE;
      const maxLineWidth = Math.max(
        ...lines.map((line) => ctx.measureText(line).width)
      );
      const textHeight = lines.length * lineHeight;
      const totalWidth = maxLineWidth + hPadding * 2;
      const totalHeight = textHeight + topPadding + bottomPadding;
      const verticalOffset = LABEL.VERTICAL_OFFSET / globalScale;

      // Calculate the rectangle position with proper top padding
      const rect = {
        id: node.id,
        x: node.x - totalWidth / 2,
        y: node.y + radius + verticalOffset - topPadding,
        width: totalWidth,
        height: totalHeight,
        collides: false,
        node,
        centerX: node.x,
        centerY: node.y + radius + verticalOffset + textHeight / 2,
        debug: {
          lines: lines.length,
          textHeight,
          topPadding,
          bottomPadding,
          totalHeight,
        },
      };

      minX = Math.min(minX, rect.x);
      minY = Math.min(minY, rect.y);
      maxX = Math.max(maxX, rect.x + rect.width);
      maxY = Math.max(maxY, rect.y + rect.height);

      return rect;
    });

    const bounds = {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };

    const quadtree = new QuadTree(bounds);
    const visibleNodes = new Set();
    const processedNodes = new Set();
    let labelNodeCollisions = 0;

    // Process all labels for collision detection and apply forces
    for (const labelRect of labelRects) {
      if (processedNodes.has(labelRect.id)) continue;

      const collisions = quadtree.query(labelRect);
      let hasCollision = false;

      // Check for label-to-node collisions
      nodes.forEach((otherNode) => {
        if (otherNode.id === labelRect.id) return; // Skip self

        const nodeRadius = (otherNode.size / 2) * NODE.SIZE_SCALE;
        if (this.checkLabelNodeCollision(labelRect, otherNode, nodeRadius)) {
          hasCollision = true;
          labelRect.collides = true;
          labelNodeCollisions++;

          // Calculate and apply repulsion force
          const dx = otherNode.x - labelRect.centerX;
          const dy = otherNode.y - labelRect.centerY;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance > 0) {
            const force =
              LABEL.REPULSION.STRENGTH /
              Math.max(LABEL.REPULSION.MIN_DISTANCE, distance);

            if (otherNode.vx !== undefined) {
              otherNode.vx += (dx / distance) * force;
              otherNode.vy += (dy / distance) * force;
            }
          }
        }
      });

      // Original label-to-label collision handling
      if (!hasCollision && collisions.length === 0) {
        visibleNodes.add(labelRect.id);
        quadtree.insert(labelRect);
      } else {
        processedNodes.add(labelRect.id);
        visibleNodes.delete(labelRect.id);
        labelRect.collides = true;

        // Apply repulsion forces for each label collision
        for (const collision of collisions) {
          processedNodes.add(collision.id);
          visibleNodes.delete(collision.id);
          collision.collides = true;

          const dx = collision.node.x - labelRect.centerX;
          const dy = collision.node.y - labelRect.centerY;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance > 0) {
            const force =
              LABEL.REPULSION.STRENGTH /
              Math.max(LABEL.REPULSION.MIN_DISTANCE, distance);

            if (collision.node.vx !== undefined) {
              collision.node.vx += (dx / distance) * force;
              collision.node.vy += (dy / distance) * force;
            }
          }
        }
      }
    }

    return { visibleNodes, labelRects, labelNodeCollisions };
  }
}
