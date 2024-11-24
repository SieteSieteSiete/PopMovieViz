// src/components/debug/DebugOverlay.jsx
import { useMemo } from 'react';

const DebugOverlay = ({ 
  nodes, 
  labelRects, 
  globalScale, 
  showDebug = false,
  onDebugInfoUpdate 
}) => {
  const paintDebugInfo = useMemo(() => {
    return (ctx) => {
      if (!showDebug || !labelRects || globalScale < 1.5) return;

      // Draw collision boundaries
      ctx.save();
      labelRects.forEach(rect => {
        ctx.strokeStyle = rect.collides ? 'rgba(255, 0, 0, 0.5)' : 'rgba(0, 255, 0, 0.5)';
        ctx.lineWidth = 1 / globalScale;
        ctx.strokeRect(
          rect.x,
          rect.y,
          rect.width,
          rect.height
        );
      });
      ctx.restore();

      // Update debug statistics
      if (onDebugInfoUpdate) {
        onDebugInfoUpdate({
          visibleLabelsCount: labelRects.filter(r => !r.collides).length,
          totalLabels: labelRects.length,
          collidingLabels: labelRects.filter(r => r.collides).length
        });
      }
    };
  }, [showDebug, labelRects, globalScale, onDebugInfoUpdate]);

  return paintDebugInfo;
};

export default DebugOverlay;