// src/components/debug/ShowDebugButton.jsx
const ShowDebugButton = ({ onShow }) => (
    <button
      onClick={onShow}
      className="fixed top-4 right-4 bg-gray-900/90 text-gray-200 px-4 py-2 rounded border border-gray-700"
    >
      Show Debug
    </button>
  );
  
  export default ShowDebugButton;