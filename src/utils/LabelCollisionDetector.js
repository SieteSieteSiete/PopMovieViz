// src/utils/LabelCollisionDetector.js
import { QuadTree } from './QuadTree';
import { LABEL, NODE } from '../constants';

export class LabelCollisionDetector {
  static calculateLabelRects(nodes, ctx, globalScale, truncateTitle, zoomThreshold) {
    if (globalScale < zoomThreshold) return { visibleNodes: new Set(), labelRects: [] };

    // Find bounds of the graph
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    // Calculate all label rectangles and graph bounds
    const labelRects = nodes.map(node => {
      const label = truncateTitle(node.title);
      ctx.font = `${LABEL.FONT.SIZE / globalScale}px ${LABEL.FONT.FAMILY}`;
      const textWidth = ctx.measureText(label).width;
      const padding = LABEL.PADDING / globalScale;
      const textHeight = LABEL.HEIGHT / globalScale;
      const radius = (node.size / 2) * NODE.SIZE_SCALE;

      const rect = {
        id: node.id,
        x: node.x - textWidth / 2 - padding,
        y: node.y + radius + LABEL.VERTICAL_OFFSET / globalScale,
        width: textWidth + padding * 2,
        height: textHeight + padding * 2,
        collides: false
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
      height: maxY - minY
    };

    const quadtree = new QuadTree(bounds);
    const visibleNodes = new Set();
    const processedNodes = new Set();

    // Process all labels for collision detection
    for (const labelRect of labelRects) {
      if (processedNodes.has(labelRect.id)) continue;

      const collisions = quadtree.query(labelRect);
      
      if (collisions.length === 0) {
        visibleNodes.add(labelRect.id);
        quadtree.insert(labelRect);
      } else {
        processedNodes.add(labelRect.id);
        visibleNodes.delete(labelRect.id);
        labelRect.collides = true;
        
        for (const collision of collisions) {
          processedNodes.add(collision.id);
          visibleNodes.delete(collision.id);
          collision.collides = true;
        }
      }
    }

    return { visibleNodes, labelRects };
  }
}