import React, { useState, useMemo, useEffect } from 'react';
import type { PageComponent, Page, ThemeStyles, Viewport, ProjectSettings } from '../types';
import { generateProjectFiles, generateSelfContainedPageHtml } from '../services/codeGenerator';

declare global {
    interface Window {
        Prism: {
            highlightAllUnder: (element: Element) => void;
        };
    }
}

interface CodeModalProps {
  pages: Page[];
  pageLayouts: Record<string, PageComponent[]>;
  theme: ThemeStyles;
  viewport: Viewport;
  projectSettings: ProjectSettings;
  onClose: () => void;
}

type ExportType = 'project' | 'single';

const CodeModal: React.FC<CodeModalProps> = ({ pages, pageLayouts, theme, viewport, projectSettings, onClose }) => {
  const [exportType, setExportType] = useState<ExportType>('project');
  const [copySuccess, setCopySuccess] = useState('');
  
  // State for Project Export
  const [projectFiles, setProjectFiles] = useState<Record<string, string>>({});
  const [selectedFile, setSelectedFile] = useState<string>('');
  
  // State for Single Page Export
  const [selectedPageId, setSelectedPageId] = useState<string>(pages[0]?.id || '');
  
  const singlePageCode = useMemo(() => {
    if (exportType === 'single' && selectedPageId) {
        return generateSelfContainedPageHtml(pages, pageLayouts, theme, viewport, selectedPageId, projectSettings);
    }
    return '';
  }, [exportType, selectedPageId, pages, pageLayouts, theme, viewport, projectSettings]);
  
  useEffect(() => {
      const files = generateProjectFiles(pages, pageLayouts, theme, projectSettings);
      setProjectFiles(files);
      setSelectedFile(Object.keys(files)[0] || '');
      if(pages.length > 0 && !pages.find(p => p.id === selectedPageId)) {
        setSelectedPageId(pages[0].id);
      } else if (pages.length === 0) {
        setSelectedPageId('');
      }
  }, [pages, pageLayouts, theme, projectSettings, selectedPageId]);

  const codeContainerRef = React.useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (codeContainerRef.current && window.Prism) {
        window.Prism.highlightAllUnder(codeContainerRef.current);
    }
  }, [exportType, selectedFile, projectFiles, selectedPageId, singlePageCode]);

  const handleCopy = async () => {
    const textToCopy = exportType === 'project' ? projectFiles[selectedFile] : singlePageCode;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopySuccess('Copied!');
      setTimeout(() => setCopySuccess(''), 2000);
    } catch (err) {
      setCopySuccess('Failed to copy');
      setTimeout(() => setCopySuccess(''), 2000);
    }
  };
  
  const getLangForFile = (filename: string): string => {
      if (filename.endsWith('.html')) return 'html';
      if (filename.endsWith('.css')) return 'css';
      if (filename.endsWith('.js')) return 'javascript';
      return 'markup';
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col">
        <header className="p-4 border-b border-slate-700 flex justify-between items-center flex-shrink-0">
          <h2 className="text-xl font-bold">Export Code</h2>
           <div className="flex items-center gap-4">
               <div className="flex p-1 bg-slate-900 rounded-md">
                   <button onClick={() => setExportType('project')} className={`px-3 py-1 text-sm rounded ${exportType === 'project' ? 'bg-indigo-600' : 'hover:bg-slate-700'}`}>Project (ZIP)</button>
                   <button onClick={() => setExportType('single')} className={`px-3 py-1 text-sm rounded ${exportType === 'single' ? 'bg-indigo-600' : 'hover:bg-slate-700'}`}>Single Page</button>
               </div>
               <button onClick={handleCopy} className="bg-slate-600 hover:bg-slate-500 text-white text-sm font-bold py-2 px-4 rounded">{copySuccess || 'Copy Code'}</button>
               <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl">&times;</button>
           </div>
        </header>

        <main ref={codeContainerRef} className="flex-1 flex overflow-hidden">
            {exportType === 'project' && (
                <>
                    <aside className="w-56 bg-slate-800 border-r border-slate-700 p-2 overflow-y-auto">
                        <ul className="space-y-1">
                            {Object.keys(projectFiles).map(filename => (
                                <li key={filename}>
                                    <button onClick={() => setSelectedFile(filename)} className={`w-full text-left px-2 py-1.5 text-sm rounded ${selectedFile === filename ? 'bg-indigo-600/50 text-white' : 'hover:bg-slate-700 text-slate-300'}`}>
                                        {filename}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </aside>
                    <div className="flex-1 overflow-auto bg-[#272822]">
                        <pre className="h-full p-4 text-sm"><code className={`language-${getLangForFile(selectedFile)}`}>{projectFiles[selectedFile]}</code></pre>
                    </div>
                </>
            )}
            {exportType === 'single' && (
                <div className="flex-1 flex flex-col">
                    <div className="p-2 border-b border-slate-700 bg-slate-800">
                        <select
                            value={selectedPageId}
                            onChange={e => setSelectedPageId(e.target.value)}
                            className="bg-slate-700 border border-slate-600 rounded-md p-2 text-sm"
                        >
                            {pages.map(page => <option key={page.id} value={page.id}>Export {page.name} page</option>)}
                        </select>
                    </div>
                    <div className="flex-1 overflow-auto bg-[#272822]">
                        <pre className="h-full p-4 text-sm"><code className="language-html">{singlePageCode}</code></pre>
                    </div>
                </div>
            )}
        </main>

      </div>
    </div>
  );
};

export default CodeModal;