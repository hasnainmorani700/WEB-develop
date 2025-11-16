
import React from 'react';
import { PALETTE_SECTIONS } from '../constants';

interface SectionsPanelProps {
  onDragStart: (e: React.DragEvent, sectionType: string) => void;
}

const SectionsPanel: React.FC<SectionsPanelProps> = ({ onDragStart }) => {
  return (
    <div className="p-4 flex flex-col gap-4 overflow-y-auto">
      <h2 className="text-xl font-bold text-gray-300">Sections</h2>
      <div className="flex flex-col gap-2">
        {PALETTE_SECTIONS.map(({ type, name, icon }) => (
          <div
            key={type}
            draggable
            onDragStart={(e) => onDragStart(e, type)}
            className="p-3 bg-gray-700 rounded-md cursor-grab flex items-center gap-3 hover:bg-gray-600 transition-colors"
          >
            {icon}
            <span className="text-sm text-slate-100">{name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SectionsPanel;