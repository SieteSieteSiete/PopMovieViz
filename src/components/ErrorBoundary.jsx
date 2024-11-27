//src/components/ErrorBoundary.jsx
import React from 'react';
import PropTypes from 'prop-types';
import ErrorDisplay from './common/ErrorDisplay';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log error to your preferred logging service
    console.error('Graph Visualization Error:', {
      error,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    
    // Attempt recovery by refreshing data or resetting state
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorDisplay
          title={this.props.title || 'Something went wrong'}
          message={this.props.message || 'An error occurred while rendering the visualization'}
          error={process.env.NODE_ENV === 'development' ? this.state.error : null}
          onRetry={this.handleReset}
          showDetails={process.env.NODE_ENV === 'development'}
        />
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  title: PropTypes.string,
  message: PropTypes.string,
  onReset: PropTypes.func,
  showReload: PropTypes.bool
};

ErrorBoundary.defaultProps = {
  showReload: true
};

export default ErrorBoundary;