// src/utils/LabelCollisionDetector.js
import { QuadTree } from './QuadTree';
import { LABEL, NODE, ZOOM } from '../constants';
import { wrapText } from './textWrapper';

export class LabelCollisionDetector {
  static calculateLabelRects(nodes, ctx, globalScale) {
    if (globalScale < ZOOM.THRESHOLD) return { visibleNodes: new Set(), labelRects: [] };

    // Find bounds of the graph
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    // Calculate all label rectangles and graph bounds
    const labelRects = nodes.map(node => {
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
      const maxLineWidth = Math.max(...lines.map(line => ctx.measureText(line).width));
      const totalHeight = (lines.length * lineHeight) + topPadding + bottomPadding;
      const totalWidth = maxLineWidth + (hPadding * 2);

      const rect = {
        id: node.id,
        x: node.x - totalWidth / 2,
        y: node.y + radius + LABEL.VERTICAL_OFFSET / globalScale,
        width: totalWidth,
        height: totalHeight,
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