import React from 'react';

function ProgressBar({ progress }) {
  return (
    <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
      <div
        className="bg-gradient-to-r from-primary-500 to-primary-600 h-full rounded-full transition-all duration-300 ease-out"
        style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
      />
    </div>
  );
}

export default ProgressBar;

