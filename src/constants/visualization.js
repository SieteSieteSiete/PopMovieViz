// src/constants/visualization.js
export const ZOOM = {
  THRESHOLD: 1.5,
  MIN_SCALE: 0.1,
  MAX_SCALE: 10
};

export const COLORS = {
  BACKGROUND: '#111827',
  LINK: 'rgba(255, 255, 255, 0.2)',
  LABEL_BACKGROUND: 'rgba(0, 0, 0, 0.6)',
  LABEL_TEXT: 'white',
  DEBUG_COLLISION: {
    COLLIDING: 'rgba(255, 0, 0, 0.5)',
    NOT_COLLIDING: 'rgba(0, 255, 0, 0.5)'
  }
};

export const LABEL = {
  FONT: {
    FAMILY: 'Arial',
    SIZE: 12,
    LINE_HEIGHT: 12
  },
  PADDING: {
    HORIZONTAL: 0,    // Renamed from just PADDING for clarity
    TOP: 0,          // Split vertical padding into TOP
    BOTTOM: 0        // and BOTTOM for more control
  },
  VERTICAL_OFFSET: 2,
  MAX_LINES: 2,
  MAX_WIDTH: 71,
  REPULSION: {
    STRENGTH: 0.5,  // Added repulsion configuration
    MIN_DISTANCE: 1 // Minimum distance before repulsion takes effect
  }
};

export const NODE = {
  SIZE_SCALE: 0.15
};