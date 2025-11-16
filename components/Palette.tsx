
import React from 'react';
import { PALETTE_COMPONENTS } from '../constants';
import { ComponentType } from '../types';

interface PaletteProps {
  onDragStart: (e: React.DragEvent, componentType: ComponentType) => void;
}

const Palette: React.FC<PaletteProps> = ({ onDragStart }) => {
  return (
    <div className="w-64 bg-gray-800 p-4 flex flex-col gap-4">
      <h2 className="text-xl font-bold text-gray-300">Components</h2>
      <div className="grid grid-cols-2 gap-2">
        {PALETTE_COMPONENTS.map(({ type, name, icon }) => (
          <div
            key={type}
            draggable
            onDragStart={(e) => onDragStart(e, type)}
            className="p-2 bg-gray-700 rounded-md cursor-grab flex flex-col items-center gap-2 hover:bg-gray-600 transition-colors"
          >
            {icon}
            <span className="text-xs text-gray-400">{name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Palette;