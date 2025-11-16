
import { useState, useCallback, useMemo, useEffect } from 'react';
import { useHistory } from './useHistory';
import { ComponentType } from '../types';
import type { PageComponent, Page, ThemeStyles, Viewport, ProjectSettings } from '../types';
// FIX: Import DEFAULT_THEME from constants.
import { createNewComponent, PALETTE_SECTIONS, VIEWPORTS, STYLE_OPTIONS, DEFAULT_THEME } from '../constants';
import { findComponent, updateComponent, addComponent, removeComponent } from '../utils/layoutUtils';

interface AppState {
  pages: Page[];
  activePageId: string | null;
  pageLayouts: Record<string, PageComponent[]>;
}

const INITIAL_APP_STATE: AppState = {
    pages: [],
    activePageId: null,
    pageLayouts: {},
};

export const useProjectState = () => {
    // Core state with undo/redo
    const { state, setState, undo, redo, canUndo, canRedo, resetState } = useHistory<AppState>(INITIAL_APP_STATE);
    const { pages, activePageId, pageLayouts } = state;

    // UI/Session state (not part of undo/redo history)
    const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
    const [theme, setTheme] = useState<ThemeStyles>(DEFAULT_THEME);
    const [projectSettings, setProjectSettings] = useState<ProjectSettings>({ globalJs: '', globalHeadContent: '' });
    const [activeViewport, setActiveViewport] = useState<Viewport>(VIEWPORTS[0]);
    const [newlyCreatedPageId, setNewlyCreatedPageId] = useState<string | null>(null);
    
    // Derived state
    const activeLayout = useMemo(() => activePageId ? pageLayouts[activePageId] || [] : [], [activePageId, pageLayouts]);
    const activePage = useMemo(() => pages.find(p => p.id === activePageId), [pages, activePageId]);
    const selectedComponent = useMemo(() => {
        if (!selectedComponentId) return null;
        return findComponent(activeLayout, selectedComponentId).component;
    }, [selectedComponentId, activeLayout]);

    // Initialize project with a first page
    useEffect(() => {
        if (pages.length === 0 && activePageId === null) {
          const firstPageName = prompt("What would you like to name your first page?", "Home");
          const pageName = firstPageName || "Home";
          const newPageId = pageName.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
          const newPage: Page = { id: newPageId, name: pageName, seoTitle: pageName, seoDescription: `This is the ${pageName} page.` };
          resetState({
            pages: [newPage],
            pageLayouts: { [newPageId]: [] },
            activePageId: newPageId
          });
        }
    }, [pages.length, activePageId, resetState]);


    // Actions / Handlers (memoized for performance)
    const handleSelectPage = useCallback((pageId: string) => {
        if (pageId !== activePageId) {
            // This is a special case where we don't want to add to undo history, so we modify state directly.
            // A page change is considered a UI action, not a data mutation to be undone.
            // FIX: The `setState` from useHistory does not accept a function. Pass the new state object directly.
             setState({ ...state, activePageId: pageId });
            setSelectedComponentId(null);
        }
    }, [activePageId, state, setState]);
    
    const handleDrop = useCallback((e: React.DragEvent, parentId: string | null) => {
        if (!activePageId) return;

        const componentType = e.dataTransfer.getData('componentType') as ComponentType;
        const sectionType = e.dataTransfer.getData('sectionType');
        const droppedText = e.dataTransfer.getData('text/plain');
        if (!componentType && !sectionType && !droppedText) return;

        const dropTarget = (e.currentTarget as HTMLElement).closest('#artboard-frame') || e.currentTarget as HTMLElement;
        if (!dropTarget) return;

        const rect = dropTarget.getBoundingClientRect();
        const left = e.clientX - rect.left;
        const top = e.clientY - rect.top;

        const placeAndSelect = (newComp: PageComponent) => {
            if (newComp.stylesByViewport.Desktop?.base) {
                newComp.stylesByViewport.Desktop.base.left = `${left}px`;
                newComp.stylesByViewport.Desktop.base.top = `${top}px`;
            }
            const newLayout = addComponent(activeLayout, parentId, newComp);
            setState({ ...state, pageLayouts: { ...pageLayouts, [activePageId]: newLayout } });
            setSelectedComponentId(newComp.id);
        };
        
        if (componentType) placeAndSelect(createNewComponent(componentType));
        else if (sectionType) {
            const section = PALETTE_SECTIONS.find(s => s.type === sectionType);
            if (section) placeAndSelect(section.getStructure());
        } else if (droppedText) {
            const newComponent = createNewComponent(ComponentType.Text);
            newComponent.content.text = droppedText;
            Object.assign(newComponent.stylesByViewport.Desktop.base, { width: 'auto', height: 'auto', padding: 'p-2' });
            placeAndSelect(newComponent);
        }
    }, [activePageId, activeLayout, pageLayouts, setState, state]);

    const handleSelectComponent = useCallback((componentId: string) => {
        setSelectedComponentId(componentId);
    }, []);

    const handleUpdateComponent = useCallback((id: string, newProps: Partial<PageComponent>) => {
        if (!activePageId) return;
        const newLayout = updateComponent(pageLayouts[activePageId] || [], id, newProps);
        setState({ ...state, pageLayouts: { ...pageLayouts, [activePageId]: newLayout } });
    }, [activePageId, pageLayouts, setState, state]);
    
    const handleDeleteComponent = useCallback(() => {
        if(selectedComponentId && activePageId) {
            const { newLayout } = removeComponent(activeLayout, selectedComponentId);
            setState({ ...state, pageLayouts: { ...pageLayouts, [activePageId]: newLayout } });
            setSelectedComponentId(null);
        }
    }, [selectedComponentId, activePageId, activeLayout, pageLayouts, setState, state]);

    const handleDuplicateComponent = useCallback((componentId: string) => {
        if (!activePageId) return;
        const { component: original, parentComponent } = findComponent(activeLayout, componentId);
        if (!original) return;

        const cloneComponent = (comp: PageComponent): PageComponent => {
            const newId = `${comp.type}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
            const desktopStyles = comp.stylesByViewport['Desktop'];
            const newTop = `${parseFloat(desktopStyles?.base?.top || '0') + 20}px`;
            const newLeft = `${parseFloat(desktopStyles?.base?.left || '0') + 20}px`;
            return { ...comp, id: newId, name: `${comp.name} Copy`, stylesByViewport: { ...comp.stylesByViewport, Desktop: { ...(desktopStyles || {base:{}}), base: { ...desktopStyles?.base, top: newTop, left: newLeft }}}, children: comp.children.map(cloneComponent) };
        };

        const newComponent = cloneComponent(original);
        const parentId = parentComponent ? parentComponent.id : null;
        const newLayout = addComponent(activeLayout, parentId, newComponent);
        setState({ ...state, pageLayouts: { ...pageLayouts, [activePageId]: newLayout } });
        setSelectedComponentId(newComponent.id);
    }, [activePageId, activeLayout, pageLayouts, setState, state]);
    
    const handleClearCanvas = useCallback(() => {
        if (activePageId && window.confirm('Are you sure you want to clear the entire canvas for this page?')) {
            setState({ ...state, pageLayouts: { ...pageLayouts, [activePageId]: [] } });
            setSelectedComponentId(null);
        }
    }, [activePageId, pageLayouts, setState, state]);
    
    const handleCanvasDoubleClick = useCallback(() => {
        const colors = STYLE_OPTIONS.backgroundColor.filter(c => c !== 'bg-transparent');
        setTheme(t => {
            const currentBg = t.bodyBackground;
            const currentIndex = colors.indexOf(currentBg);
            const nextIndex = (currentIndex + 1) % colors.length;
            return { ...t, bodyBackground: colors[nextIndex] };
        });
    }, []);
    
    const handleAddPage = useCallback(() => {
        const pageCount = pages.filter(p => p.name.match(/^Untitled(\s\d+)?$/)).length;
        const newPageName = pageCount > 0 ? `Untitled ${pageCount + 1}` : "Untitled";
        const newPageId = newPageName.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
        const newPage: Page = { id: newPageId, name: newPageName, seoTitle: newPageName, seoDescription: `This is the ${newPageName} page.` };
        setState({ ...state, pages: [...pages, newPage], pageLayouts: { ...pageLayouts, [newPageId]: [] }, activePageId: newPageId });
        setNewlyCreatedPageId(newPageId);
    }, [pages, pageLayouts, state, setState]);

    const handleUpdatePage = useCallback((pageId: string, newProps: Partial<Page>) => {
      setState({ ...state, pages: pages.map(p => p.id === pageId ? { ...p, ...newProps } : p) });
    }, [state, setState]);

    const handleDeletePage = useCallback((pageId: string) => {
        if (pages.length <= 1) return alert("You must have at least one page.");
        const pageToDelete = pages.find(p => p.id === pageId);
        if (!pageToDelete || !window.confirm(`Are you sure you want to delete the "${pageToDelete.name}" page?`)) return;
        
        const newPages = pages.filter(p => p.id !== pageId);
        const newPageLayouts = { ...pageLayouts };
        delete newPageLayouts[pageId];
        const newActivePageId = activePageId === pageId ? (newPages[0]?.id || null) : activePageId;

        setState({ pages: newPages, pageLayouts: newPageLayouts, activePageId: newActivePageId });
        if(selectedComponentId && pageLayouts[pageId]?.some(c => c.id === selectedComponentId)) setSelectedComponentId(null);
    }, [pages, pageLayouts, activePageId, selectedComponentId, setState]);

    const handleGeneratePage = useCallback((layout: PageComponent[]) => {
        if (activePageId && window.confirm('This will replace the current page content. Are you sure?')) {
            setState({ ...state, pageLayouts: { ...pageLayouts, [activePageId]: layout } });
            setSelectedComponentId(null);
        }
    }, [activePageId, pageLayouts, setState, state]);


    return {
        // State
        projectState: state,
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
        
        // Actions
        actions: {
            undo,
            redo,
            setTheme,
            setProjectSettings,
            setActiveViewport,
            setNewlyCreatedPageId,
            handleSelectPage,
            handleDrop,
            handleSelectComponent,
            handleUpdateComponent,
            handleDeleteComponent,
            handleDuplicateComponent,
            handleClearCanvas,
            handleCanvasDoubleClick,
            handleAddPage,
            handleUpdatePage,
            handleDeletePage,
            handleGeneratePage,
        }
    };
};
