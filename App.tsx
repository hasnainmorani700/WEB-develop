
import React, { useState, useEffect } from 'react';
import Palette from './components/Palette';
import Canvas from './components/Canvas';
import PropertiesPanel from './components/PropertiesPanel';
import CodeModal from './components/CodeModal';
import AboutModal from './components/AboutModal';
import PagesPanel from './components/PagesPanel';
import GlobalStylesPanel from './components/GlobalStylesPanel';
import SectionsPanel from './components/SectionsPanel';
import SettingsPanel from './components/SettingsPanel';
import ViewportControls from './components/ViewportControls';
import PageTabs from './components/PageTabs';
import AiGenerateModal from './components/AiGenerateModal';
import { useProjectState } from './hooks/useProjectState';
import { ComponentType } from './types';
import type { PageComponent, AiProvider } from './types';
import { generateCssForLayout } from './services/codeGenerator';
// FIX: Import VIEWPORTS from constants.
import { VIEWPORTS } from './constants';

type LeftPanelTab = 'components' | 'sections' | 'pages';
type RightPanelTab = 'element' | 'global' | 'settings';

const App: React.FC = () => {
  const {
    projectState,
    theme,
    projectSettings,
    activeViewport,
    selectedComponentId,
    newlyCreatedPageId,
    activeLayout,
    activePage,
    selectedComponent,
    canUndo,
    canRedo,
    actions,
  } = useProjectState();
  const { pages, activePageId, pageLayouts } = projectState;

  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  
  const [apiKeys, setApiKeys] = useState<Partial<Record<AiProvider, string>>>(() => ({
    deepseek: localStorage.getItem('deepseekApiKey') || undefined,
    gemini: localStorage.getItem('geminiApiKey') || undefined,
    chatgpt: localStorage.getItem('chatgptApiKey') || undefined,
  }));

  const [leftTab, setLeftTab] = useState<LeftPanelTab>('components');
  const [rightTab, setRightTab] = useState<RightPanelTab>('global');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return;
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const isUndo = (isMac ? e.metaKey : e.ctrlKey) && e.key === 'z';
      const isRedo = (isMac ? e.metaKey : e.ctrlKey) && e.key === 'y';

      if (isUndo) { e.preventDefault(); actions.undo(); } 
      else if (isRedo) { e.preventDefault(); actions.redo(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [actions.undo, actions.redo]);

  useEffect(() => {
    const styleId = 'dynamic-app-styles';
    let styleEl = document.getElementById(styleId);
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    const cssToInject = activePageId ? generateCssForLayout(activeLayout) : '';
    styleEl.innerHTML = cssToInject;
  }, [activeLayout, activePageId]);

  const handlePaletteDragStart = (e: React.DragEvent, type: ComponentType) => e.dataTransfer.setData('componentType', type);
  const handleSectionDragStart = (e: React.DragEvent, type: string) => e.dataTransfer.setData('sectionType', type);
  
  const handleSelectComponent = (e: React.MouseEvent, componentId: string) => {
    e.stopPropagation();
    actions.handleSelectComponent(componentId);
    if(componentId) setRightTab('element');
  };
  
  const handleGeneratePage = (layout: PageComponent[]) => {
    actions.handleGeneratePage(layout);
    setIsAiModalOpen(false);
  };

  const handleSetApiKey = (provider: AiProvider, key: string) => {
    if (key.trim()) {
      localStorage.setItem(`${provider}ApiKey`, key.trim());
      setApiKeys(prev => ({ ...prev, [provider]: key.trim() }));
    }
  };

  const handleClearApiKey = (provider: AiProvider) => {
    localStorage.removeItem(`${provider}ApiKey`);
    setApiKeys(prev => {
      const newKeys = { ...prev };
      delete newKeys[provider];
      return newKeys;
    });
  };

  if (!activePageId) return <div className="flex h-screen w-screen items-center justify-center bg-slate-900 text-white">Initializing...</div>;

  const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button onClick={onClick} className={`px-4 py-2 text-sm font-medium flex-1 transition-colors ${active ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`}>{children}</button>
  );

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-900 text-white font-sans">
      <header className="h-16 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-4 z-10 flex-shrink-0">
        <h1 className="text-xl font-bold text-slate-200">Gemini Web Weaver</h1>
        <div className="flex items-center gap-2">
            <button onClick={actions.undo} disabled={!canUndo} className="px-3 py-1.5 rounded-md hover:bg-slate-700 transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed">Undo</button>
            <button onClick={actions.redo} disabled={!canRedo} className="px-3 py-1.5 rounded-md hover:bg-slate-700 transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed">Redo</button>
            <div className="w-px h-6 bg-slate-700"/>
            <button onClick={actions.handleDeleteComponent} disabled={!selectedComponentId} className="px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed">Delete</button>
            <button onClick={actions.handleClearCanvas} className="px-3 py-1.5 bg-slate-600 text-white rounded-md hover:bg-slate-700 transition-colors text-sm font-semibold">Clear</button>
            <div className="w-px h-6 bg-slate-700"/>
            <button onClick={() => setIsAiModalOpen(true)} className="px-3 py-1.5 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm font-semibold">Generate with AI</button>
            <button onClick={() => setIsAboutModalOpen(true)} className="px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm font-semibold">About</button>
            <button onClick={() => setIsCodeModalOpen(true)} className="px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-semibold">Export Code</button>
        </div>
      </header>
      
      <PageTabs pages={pages} activePageId={activePageId} onSelectPage={actions.handleSelectPage} onAddPage={actions.handleAddPage} />

      <main className="flex w-full flex-1 overflow-hidden">
        <div className="w-64 bg-slate-800 flex flex-col h-full">
            <div className="flex border-b border-slate-700"><TabButton active={leftTab === 'components'} onClick={() => setLeftTab('components')}>Components</TabButton><TabButton active={leftTab === 'sections'} onClick={() => setLeftTab('sections')}>Sections</TabButton><TabButton active={leftTab === 'pages'} onClick={() => setLeftTab('pages')}>Pages</TabButton></div>
            <div className="flex-1 overflow-y-auto">
                {leftTab === 'components' && <Palette onDragStart={handlePaletteDragStart} />}
                {leftTab === 'sections' && <SectionsPanel onDragStart={handleSectionDragStart} />}
                {leftTab === 'pages' && <PagesPanel pages={pages} activePageId={activePageId} onSelectPage={actions.handleSelectPage} onAddPage={actions.handleAddPage} onUpdatePage={actions.handleUpdatePage} onDeletePage={actions.handleDeletePage} newlyCreatedPageId={newlyCreatedPageId} onRenameComplete={() => actions.setNewlyCreatedPageId(null)} />}
            </div>
        </div>
        <div className="flex-1 flex flex-col h-full">
            <ViewportControls viewports={VIEWPORTS} activeViewport={activeViewport} onViewportChange={actions.setActiveViewport} />
            <Canvas layout={activeLayout} theme={theme} viewport={activeViewport} onDrop={(e, p) => actions.handleDrop(e, p)} onSelect={handleSelectComponent} selectedComponentId={selectedComponentId} onUpdateComponent={actions.handleUpdateComponent} onDuplicateComponent={actions.handleDuplicateComponent} onCanvasDoubleClick={actions.handleCanvasDoubleClick} />
        </div>
        <div className="w-80 bg-slate-800 flex flex-col h-full">
            <div className="flex border-b border-slate-700"><TabButton active={rightTab === 'element'} onClick={() => setRightTab('element')}>Element</TabButton><TabButton active={rightTab === 'global'} onClick={() => setRightTab('global')}>Global</TabButton><TabButton active={rightTab === 'settings'} onClick={() => setRightTab('settings')}>Settings</TabButton></div>
            {rightTab === 'element' && <PropertiesPanel pages={pages} component={selectedComponent} onUpdate={actions.handleUpdateComponent} activeViewport={activeViewport} />}
            {rightTab === 'global' && <GlobalStylesPanel theme={theme} onUpdateTheme={actions.setTheme} />}
            {rightTab === 'settings' && <SettingsPanel projectSettings={projectSettings} onUpdateProjectSettings={actions.setProjectSettings} activePage={activePage} onUpdatePage={actions.handleUpdatePage} />}
        </div>
      </main>
      {isCodeModalOpen && <CodeModal pages={pages} pageLayouts={pageLayouts} theme={theme} viewport={activeViewport} projectSettings={projectSettings} onClose={() => setIsCodeModalOpen(false)} />}
      {isAboutModalOpen && <AboutModal onClose={() => setIsAboutModalOpen(false)} />}
      {isAiModalOpen && <AiGenerateModal 
          apiKeys={apiKeys} 
          onSetApiKey={handleSetApiKey} 
          onClearApiKey={handleClearApiKey} 
          onClose={() => setIsAiModalOpen(false)} 
          onGenerate={handleGeneratePage} 
      />}
    </div>
  );
};

export default App;
