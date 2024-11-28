// src/App.jsx
import PropTypes from 'prop-types';
import MovieNetworkGraph from './components/MovieNetworkGraph';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary
      context="application"
      title="Application Error"
      message="An unexpected error occurred in the application"
      showReload={true}
    >
      <div className="min-h-screen bg-gray-100">
        <MovieNetworkGraph />
      </div>
    </ErrorBoundary>
  );
}

App.propTypes = {
};

export default App;