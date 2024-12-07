// src/workers/labelCollisionWorker.js

import { LABEL, NODE, ZOOM } from "../constants";
import { QuadTree } from "../utils/QuadTree";
import { wrapText } from "../utils/textWrapper";

// Cache for text measurements
const textMeasurementCache = new Map();

// Offscreen canvas for text measurements
let offscreenCanvas;
let ctx;

self.onmessage = function (e) {
  const { nodes, globalScale, canvasWidth, canvasHeight } = e.data;

  if (!offscreenCanvas) {
    offscreenCanvas = new OffscreenCanvas(canvasWidth, canvasHeight);
    ctx = offscreenCanvas.getContext("2d");
  }

  const result = calculateLabelRects(nodes, globalScale);
  self.postMessage(result);
};

// Memoized text measurement function
function measureText(text, font) {
  const key = `${text}-${font}`;
  if (!textMeasurementCache.has(key)) {
    ctx.font = font;
    const measurement = ctx.measureText(text);
    textMeasurementCache.set(key, measurement.width);

    // Cache cleanup - keep only last 1000 measurements
    if (textMeasurementCache.size > 1000) {
      const firstKey = textMeasurementCache.keys().next().value;
      textMeasurementCache.delete(firstKey);
    }
  }
  return textMeasurementCache.get(key);
}

function calculateLabelRects(nodes, globalScale) {
  if (!nodes || !Array.isArray(nodes) || globalScale < ZOOM.THRESHOLD) {
    return {
      visibleNodes: [],
      labelRects: [],
      labelNodeCollisions: 0,
      labelLabelCollisions: 0,
    };
  }

  let minX = Infinity,
    minY = Infinity;
  let maxX = -Infinity,
    maxY = -Infinity;

  // Memoized font calculation
  const fontSize = LABEL.FONT.SIZE / globalScale;
  const font = `${fontSize}px ${LABEL.FONT.FAMILY}`;
  const lineHeight = LABEL.FONT.LINE_HEIGHT / globalScale;
  const hPadding = LABEL.PADDING.HORIZONTAL / globalScale;
  const topPadding = LABEL.PADDING.TOP / globalScale;
  const bottomPadding = LABEL.PADDING.BOTTOM / globalScale;
  const maxWidth = LABEL.MAX_WIDTH / globalScale;

  // Pre-calculate wrapped text for all nodes
  const wrappedTextCache = new Map();
  nodes.forEach((node) => {
    const lines = wrapText(ctx, node.title, maxWidth);
    wrappedTextCache.set(node.id, lines);
  });

  // Calculate label rectangles with cached values
  const labelRects = nodes.map((node) => {
    const lines = wrappedTextCache.get(node.id);
    const maxLineWidth = Math.max(
      ...lines.map((line) => measureText(line, font))
    );
    const textHeight = lines.length * lineHeight;
    const totalWidth = maxLineWidth + hPadding * 2;
    const totalHeight = textHeight + topPadding + bottomPadding;
    const radius = (node.size / 2) * NODE.SIZE_SCALE;
    const verticalOffset = LABEL.VERTICAL_OFFSET / globalScale;

    const rect = {
      id: node.id,
      x: node.x - totalWidth / 2,
      y: node.y + radius + verticalOffset - topPadding,
      width: totalWidth,
      height: totalHeight,
      collides: false,
      nodeCollision: false,
      labelCollision: false,
      node,
      centerX: node.x,
      centerY: node.y + radius + verticalOffset + textHeight / 2,
    };

    // Update bounds
    minX = Math.min(minX, rect.x);
    minY = Math.min(minY, rect.y);
    maxX = Math.max(maxX, rect.x + rect.width);
    maxY = Math.max(maxY, rect.y + rect.height);

    return rect;
  });

  // Create QuadTree for spatial partitioning
  const bounds = { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  const quadtree = new QuadTree(bounds);
  const visibleNodes = new Set();
  let labelNodeCollisions = 0;
  let labelLabelCollisions = 0;

  // First pass: Check node collisions
  for (const labelRect of labelRects) {
    // Check collisions with nodes
    for (const otherNode of nodes) {
      if (otherNode.id === labelRect.id) continue;

      const nodeRadius = (otherNode.size / 2) * NODE.SIZE_SCALE;
      if (checkLabelNodeCollision(labelRect, otherNode, nodeRadius)) {
        labelRect.collides = true;
        labelRect.nodeCollision = true;
        labelNodeCollisions++;
        break;
      }
    }
  }

  // Second pass: Check label-to-label collisions
  // We use a temporary set to track which labels we've already processed
  const processedCollisions = new Set();

  for (const labelRect of labelRects) {
    // Skip if already marked as colliding from node collision
    if (labelRect.collides) continue;
    if (processedCollisions.has(labelRect.id)) continue;

    // Get potential collisions from quadtree
    const collisions = quadtree.query(labelRect);
    let hasCollision = false;

    for (const collidingRect of collisions) {
      if (collidingRect.id === labelRect.id) continue;
      if (collidingRect.collides) continue;

      // Mark both labels as colliding
      labelRect.collides = true;
      labelRect.labelCollision = true;
      collidingRect.collides = true;
      collidingRect.labelCollision = true;

      // Track that we've processed both labels
      processedCollisions.add(labelRect.id);
      processedCollisions.add(collidingRect.id);

      hasCollision = true;
      labelLabelCollisions += 2; // Count both labels
    }

    // Only add to quadtree and visible set if no collisions
    if (!hasCollision && !labelRect.collides) {
      visibleNodes.add(labelRect.id);
      quadtree.insert(labelRect);
    }
  }

  return {
    visibleNodes: Array.from(visibleNodes),
    labelRects,
    labelNodeCollisions,
    labelLabelCollisions,
  };
}

function checkLabelNodeCollision(labelRect, node, nodeRadius) {
  const closestX = Math.max(
    labelRect.x,
    Math.min(node.x, labelRect.x + labelRect.width)
  );
  const closestY = Math.max(
    labelRect.y,
    Math.min(node.y, labelRect.y + labelRect.height)
  );

  const dx = node.x - closestX;
  const dy = node.y - closestY;
  const distanceSquared = dx * dx + dy * dy;

  return distanceSquared < nodeRadius * nodeRadius;
}
