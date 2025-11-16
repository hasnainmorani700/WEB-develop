import React from 'react';
import type { PageComponent, ThemeStyles, Viewport } from '../types';
import CanvasItem from './CanvasItem';

interface CanvasProps {
  layout: PageComponent[];
  onDrop: (e: React.DragEvent, parentId: string | null) => void;
  onSelect: (e: React.MouseEvent, componentId: string) => void;
  selectedComponentId: string | null;
  onUpdateComponent: (id: string, newProps: Partial<PageComponent>) => void;
  onDuplicateComponent: (id: string) => void;
  theme: ThemeStyles;
  viewport: Viewport;
  onCanvasDoubleClick: () => void;
}

const Canvas: React.FC<CanvasProps> = ({ layout, onDrop, onSelect, selectedComponentId, onUpdateComponent, onDuplicateComponent, theme, viewport, onCanvasDoubleClick }) => {
  const [isHovering, setIsHovering] = React.useState(false);
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsHovering(true);
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.stopPropagation();
    setIsHovering(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsHovering(false);
    onDrop(e, null);
  };

  const artboardWrapperClasses = `${theme.bodyBackground} ${theme.bodyColor}`;

  return (
    <div
      onDoubleClick={onCanvasDoubleClick}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onSelect(e, '');
        }
      }}
      className={`flex-1 overflow-auto p-8 flex justify-center items-start bg-gray-900`}
    >
      <div
        id="artboard-frame"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative shadow-2xl transition-all duration-300 ${artboardWrapperClasses} ${isHovering ? 'outline outline-2 outline-blue-500' : ''}`}
        style={{
          width: viewport.width,
          height: viewport.height,
          fontFamily: theme.fontFamily,
        }}
      >
        {layout.length > 0 ? (
          layout.map(component => (
            <CanvasItem
              key={component.id}
              component={component}
              onDrop={onDrop}
              onSelect={onSelect}
              isSelected={selectedComponentId === component.id}
              onUpdate={onUpdateComponent}
              onDuplicate={onDuplicateComponent}
              selectedComponentId={selectedComponentId}
              activeViewport={viewport}
            />
          ))
        ) : (
          <div className="w-full h-full border-2 border-dashed border-gray-400 rounded-lg flex items-center justify-center pointer-events-none">
            <p className="text-gray-500">Drag components here to start building</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Canvas;
