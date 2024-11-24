// src/utils/LabelCollisionDetector.js
import { QuadTree } from './QuadTree';

export class LabelCollisionDetector {
  static calculateLabelRects(nodes, ctx, globalScale, truncateTitle, zoomThreshold) {
    if (globalScale < zoomThreshold) return { visibleNodes: new Set(), labelRects: [] };

    // Find bounds of the graph
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    // Calculate all label rectangles and graph bounds
    const labelRects = nodes.map(node => {
      const label = truncateTitle(node.title);
      ctx.font = `${12 / globalScale}px Arial`;
      const textWidth = ctx.measureText(label).width;
      const padding = 2 / globalScale;
      const textHeight = 4 / globalScale;
      const radius = (node.size / 2) * 0.15;

      const rect = {
        id: node.id,
        x: node.x - textWidth / 2 - padding,
        y: node.y + radius + 2 / globalScale,
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

    // Process all labels
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