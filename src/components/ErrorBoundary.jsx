// src/components/ErrorBoundary.jsx
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
    console.error('Application Error:', {
      error,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      context: this.props.context || 'general'
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      const isDev = process.env.NODE_ENV === 'development';
      
      return (
        <ErrorDisplay
          title={this.props.title || 'Something went wrong'}
          message={this.props.message || 'An unexpected error occurred'}
          error={isDev ? this.state.error : null}
          errorInfo={isDev ? this.state.errorInfo : null}
          onRetry={this.props.showReload ? this.handleReset : null}
          showDetails={isDev}
          context={this.props.context}
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
  showReload: PropTypes.bool,
  context: PropTypes.string
};

ErrorBoundary.defaultProps = {
  showReload: true,
  context: 'general'
};

export default ErrorBoundary;