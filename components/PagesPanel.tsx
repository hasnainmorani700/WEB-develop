import React, { useState, useRef, useEffect } from 'react';
import type { Page } from '../types';

interface PageItemProps {
    page: Page;
    isActive: boolean;
    onSelect: () => void;
    onUpdate: (id: string, newProps: Partial<Page>) => void;
    onDelete: (id: string) => void;
    startRenaming: boolean;
    onRenameComplete: () => void;
}

const PageItem: React.FC<PageItemProps> = ({ page, isActive, onSelect, onUpdate, onDelete, startRenaming, onRenameComplete }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isRenaming, setIsRenaming] = useState(startRenaming);
    const [nameInput, setNameInput] = useState(page.name);
    const renameInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isRenaming) {
            renameInputRef.current?.focus();
            renameInputRef.current?.select();
        }
    }, [isRenaming]);

    useEffect(() => {
      // If the component is no longer flagged to start renaming, turn renaming off.
      // This handles cases where a new page is created while another is being renamed.
      if (!startRenaming && isRenaming) {
        setIsRenaming(false);
      }
    }, [startRenaming]);


    const handleRename = () => {
        setIsMenuOpen(false);
        setIsRenaming(true);
    };

    const handleRenameSubmit = () => {
        if (nameInput.trim() && nameInput !== page.name) {
            // Also update SEO title as a sensible default
            onUpdate(page.id, { name: nameInput, seoTitle: nameInput });
        }
        setIsRenaming(false);
        if (startRenaming) {
            onRenameComplete();
        }
    };
    
    const handleCancelRename = () => {
        setNameInput(page.name);
        setIsRenaming(false);
        if (startRenaming) {
            onRenameComplete();
        }
    }

    const handleDelete = () => {
        onDelete(page.id);
        setIsMenuOpen(false);
    };

    return (
        <li className="bg-gray-700 rounded-md">
            <div className="flex items-center justify-between p-2">
                {isRenaming ? (
                    <input
                        ref={renameInputRef}
                        type="text"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        onBlur={handleRenameSubmit}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRenameSubmit();
                            if (e.key === 'Escape') handleCancelRename();
                        }}
                        className="flex-1 bg-gray-800 text-sm p-0 border-none outline-none ring-2 ring-blue-500 rounded-sm"
                    />
                ) : (
                    <button
                        onClick={onSelect}
                        className={`flex-1 text-left text-sm font-medium ${isActive ? 'text-blue-400' : ''}`}
                    >
                        {page.name}
                    </button>
                )}
                <div className="relative">
                    <button onClick={() => setIsMenuOpen(prev => !prev)} className="p-1 rounded-full hover:bg-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                    </button>
                    {isMenuOpen && (
                        <div className="absolute right-0 mt-2 w-32 bg-gray-800 border border-gray-600 rounded-md shadow-lg z-10">
                            <button onClick={handleRename} className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">Rename</button>
                            <button onClick={handleDelete} className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700">Delete</button>
                        </div>
                    )}
                </div>
            </div>
            {isActive && (
                <div className="p-3 border-t border-gray-600 space-y-2">
                     <label className="text-xs text-gray-400 block">SEO Title</label>
                     <input 
                        type="text" 
                        value={page.seoTitle || ''}
                        onChange={e => onUpdate(page.id, { seoTitle: e.target.value })}
                        className="w-full bg-gray-800 text-xs p-1 rounded-sm"
                        placeholder="Title for search engines"
                    />
                     <label className="text-xs text-gray-400 block">Meta Description</label>
                     <textarea 
                        value={page.seoDescription || ''}
                        onChange={e => onUpdate(page.id, { seoDescription: e.target.value })}
                        className="w-full bg-gray-800 text-xs p-1 rounded-sm resize-none h-16"
                        placeholder="Description for search engines"
                    />
                </div>
            )}
        </li>
    );
};


interface PagesPanelProps {
    pages: Page[];
    activePageId: string;
    onSelectPage: (id: string) => void;
    onAddPage: () => void;
    onUpdatePage: (id: string, newProps: Partial<Page>) => void;
    onDeletePage: (id: string) => void;
    newlyCreatedPageId: string | null;
    onRenameComplete: () => void;
}

const PagesPanel: React.FC<PagesPanelProps> = ({ pages, activePageId, onSelectPage, onAddPage, onUpdatePage, onDeletePage, newlyCreatedPageId, onRenameComplete }) => {
    return (
        <div className="p-4 flex flex-col gap-4 h-full">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-300">Pages</h2>
                <button 
                    onClick={onAddPage}
                    className="px-2 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                >
                    + New
                </button>
            </div>
            <div className="flex-1 overflow-y-auto pr-1">
                <ul className="space-y-2">
                    {pages.map(page => (
                        <PageItem 
                            key={page.id}
                            page={page}
                            isActive={activePageId === page.id}
                            onSelect={() => onSelectPage(page.id)}
                            onUpdate={onUpdatePage}
                            onDelete={onDeletePage}
                            startRenaming={page.id === newlyCreatedPageId}
                            onRenameComplete={onRenameComplete}
                        />
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default PagesPanel;