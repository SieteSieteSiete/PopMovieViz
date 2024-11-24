// src/App.jsx
import PropTypes from 'prop-types';
import MovieNetworkGraph from './components/MovieNetworkGraph';

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <MovieNetworkGraph />
    </div>
  );
}

App.propTypes = {
};

export default App;