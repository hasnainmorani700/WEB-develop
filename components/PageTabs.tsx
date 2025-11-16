
import React from 'react';
import type { Page } from '../types';

interface PageTabsProps {
  pages: Page[];
  activePageId: string;
  onSelectPage: (id: string) => void;
  onAddPage: () => void;
}

const PageTabs: React.FC<PageTabsProps> = ({ pages, activePageId, onSelectPage, onAddPage }) => {
  return (
    <div className="h-10 bg-gray-800 flex-shrink-0 flex items-center gap-2 px-4 border-b border-t border-gray-700">
      {pages.map(page => (
        <button
          key={page.id}
          onClick={() => onSelectPage(page.id)}
          className={`px-3 py-1.5 rounded-t-md text-sm transition-colors relative ${
            activePageId === page.id
              ? 'bg-gray-900 text-white'
              : 'text-gray-400 hover:bg-gray-700 hover:text-white'
          }`}
        >
          {page.name}
        </button>
      ))}
      <button
        onClick={onAddPage}
        className="ml-2 px-2 py-1 rounded-md text-sm bg-blue-600 hover:bg-blue-700 flex items-center justify-center"
        title="Add new page"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
      </button>
    </div>
  );
};

export default PageTabs;
