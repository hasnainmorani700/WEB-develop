import React, { useState } from 'react';
import type { PageComponent } from '../types';

interface LinkPopoverProps {
  initialUrl: string;
  onSave: (url: string) => void;
  onClose: () => void;
}

const LinkPopover: React.FC<LinkPopoverProps> = ({ initialUrl, onSave, onClose }) => {
  const [url, setUrl] = useState(initialUrl);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(url);
    onClose();
  };

  return (
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-gray-700 rounded-md shadow-lg p-2 z-30">
      <form onSubmit={handleSave}>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
          className="w-full bg-gray-800 border border-gray-600 rounded-md p-2 text-sm text-white"
          autoFocus
        />
         <div className="flex justify-end gap-2 mt-2">
            <button type="button" onClick={onClose} className="px-2 py-1 text-xs bg-gray-600 rounded">Cancel</button>
            <button type="submit" className="px-2 py-1 text-xs bg-blue-600 rounded">Save</button>
        </div>
      </form>
    </div>
  );
};


interface FloatingToolbarProps {
  component: PageComponent;
  onUpdate: (id: string, newProps: Partial<PageComponent>) => void;
  onDuplicate: (id: string) => void;
}

const FloatingToolbar: React.FC<FloatingToolbarProps> = ({ component, onUpdate, onDuplicate }) => {
    const [isLinkPopoverOpen, setIsLinkPopoverOpen] = useState(false);
  
    const handleLinkSave = (url: string) => {
        onUpdate(component.id, { linkUrl: url });
    };

    const handleArrange = (direction: 'forward' | 'backward') => {
        const desktopStyles = component.stylesByViewport['Desktop']?.base || {};
        const currentZ = parseInt(desktopStyles.zIndex || '0', 10);
        const newZ = direction === 'forward' ? currentZ + 1 : currentZ - 1;
        
        onUpdate(component.id, {
            stylesByViewport: {
                ...component.stylesByViewport,
                Desktop: {
                    ...(component.stylesByViewport['Desktop'] || { base: {}, hover: {} }),
                    base: {
                        ...desktopStyles,
                        zIndex: String(newZ),
                    },
                },
            },
        });
    };

    const ToolbarButton: React.FC<{onClick: (e: React.MouseEvent) => void, children: React.ReactNode, active?: boolean, title?: string}> = ({onClick, children, active, title}) => (
        <button
            onClick={onClick}
            className={`p-2 rounded-md ${active ? 'bg-blue-700' : 'hover:bg-gray-600'}`}
            title={title}
        >
            {children}
        </button>
    )

  return (
    <div className="absolute -top-10 left-0 bg-gray-800 text-white text-xs px-2 py-1 rounded-md shadow-lg flex items-center gap-1 z-20">
      <div className="font-semibold mr-2">{component.name}</div>
      
      <div className="relative">
          <ToolbarButton onClick={() => setIsLinkPopoverOpen(prev => !prev)} active={isLinkPopoverOpen || !!component.linkUrl} title="Add/Edit Link">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
          </ToolbarButton>
          {isLinkPopoverOpen && (
              <LinkPopover 
                  initialUrl={component.linkUrl || ''}
                  onSave={handleLinkSave}
                  onClose={() => setIsLinkPopoverOpen(false)}
              />
          )}
      </div>

      <ToolbarButton onClick={() => onDuplicate(component.id)} title="Duplicate">
         <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
      </ToolbarButton>
      
      <div className="w-px h-4 bg-gray-600 mx-1"></div>

      <ToolbarButton onClick={() => handleArrange('forward')} title="Bring Forward">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" /></svg>
      </ToolbarButton>

      <ToolbarButton onClick={() => handleArrange('backward')} title="Send Backward">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
      </ToolbarButton>
    </div>
  );
};

export default FloatingToolbar;