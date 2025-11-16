import React from 'react';
import type { Viewport } from '../types';

interface ViewportControlsProps {
  viewports: Viewport[];
  activeViewport: Viewport;
  onViewportChange: (viewport: Viewport) => void;
}

const ViewportControls: React.FC<ViewportControlsProps> = ({ viewports, activeViewport, onViewportChange }) => {
  return (
    <div className="h-12 bg-gray-800 flex-shrink-0 flex justify-center items-center gap-2 border-b border-gray-700">
      {viewports.map(vp => (
        <button
          key={vp.name}
          onClick={() => onViewportChange(vp)}
          className={`px-3 py-1.5 rounded-md flex items-center gap-2 text-sm transition-colors ${
            activeViewport.name === vp.name 
              ? 'bg-blue-600 text-white' 
              : 'text-gray-400 hover:bg-gray-700 hover:text-white'
          }`}
          title={`${vp.name} (${vp.width}x${vp.height})`}
        >
          {vp.icon}
          <span className="hidden sm:inline">{vp.name}</span>
        </button>
      ))}
    </div>
  );
};

export default ViewportControls;
