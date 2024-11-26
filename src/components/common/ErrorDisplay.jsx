// src/components/common/ErrorDisplay.jsx
import PropTypes from 'prop-types';
import { memo } from 'react';

const ErrorDisplay = memo(({ 
  title = 'Error',
  message = 'An unexpected error occurred',
  error,
  onRetry,
  showDetails = false
}) => {
  return (
    <div className="rounded-lg bg-gray-800 p-6 max-w-lg w-full mx-auto shadow-xl border border-gray-700">
      <div className="flex items-center justify-center mb-4">
        <div className="w-12 h-12 text-red-500">
          <svg
            className="w-full h-full"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
      </div>
      
      <h3 className="text-xl font-semibold text-gray-100 text-center mb-2">
        {title}
      </h3>
      
      <p className="text-gray-300 text-center mb-4">
        {message}
      </p>

      {showDetails && error && (
        <div className="mb-4 p-3 bg-gray-900 rounded text-sm font-mono text-gray-400 overflow-auto">
          {error.toString()}
        </div>
      )}

      {onRetry && (
        <div className="flex justify-center">
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
});

ErrorDisplay.propTypes = {
  title: PropTypes.string,
  message: PropTypes.string,
  error: PropTypes.any,
  onRetry: PropTypes.func,
  showDetails: PropTypes.bool
};

ErrorDisplay.displayName = 'ErrorDisplay';

export default ErrorDisplay;