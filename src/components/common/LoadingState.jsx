// src/components/common/LoadingState.jsx
import PropTypes from 'prop-types';
import { memo } from 'react';
import LoadingSpinner from './LoadingSpinner';

const LoadingState = memo(({ 
  type = 'initial',
  progress = null
}) => {
  const messages = {
    initial: 'Loading movie network data...',
    processing: 'Processing graph data...',
    rendering: 'Preparing visualization...'
  };

  return (
    <div className="fixed inset-0 w-full min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="text-center">
        <LoadingSpinner size="lg" message={messages[type]} />
        {progress !== null && (
          <div className="mt-4 w-64">
            <div className="w-full bg-gray-700 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
            <p className="text-gray-400 text-sm mt-2">
              {Math.round(progress)}% complete
            </p>
          </div>
        )}
      </div>
    </div>
  );
});

LoadingState.propTypes = {
  type: PropTypes.oneOf(['initial', 'processing', 'rendering']),
  progress: PropTypes.number
};

LoadingState.displayName = 'LoadingState';

export default LoadingState;