import React from 'react';
import { ComponentType } from '../types';
import type { PageComponent, ComponentStyles, Viewport, ViewportStyles } from '../types';
import FloatingToolbar from './FloatingToolbar';
import { getResolvedStyles } from '../utils/styleResolver';
import { VIEWPORTS, ICON_LIBRARY, STYLE_OPTIONS } from '../constants';

interface CanvasItemProps {
  component: PageComponent;
  onDrop: (e: React.DragEvent, parentId: string | null) => void;
  onSelect: (e: React.MouseEvent, componentId: string) => void;
  isSelected: boolean;
  onUpdate: (id: string, newProps: Partial<PageComponent>) => void;
  onDuplicate: (id: string) => void;
  selectedComponentId: string | null;
  activeViewport: Viewport;
}

const Resizer: React.FC<{ onMouseDown: (e: React.MouseEvent) => void; className: string }> = ({ onMouseDown, className }) => (
  <div
    onMouseDown={onMouseDown}
    className={`absolute w-3 h-3 bg-blue-500 border-2 border-white rounded-full z-20 ${className}`}
  />
);

const CanvasItem: React.FC<CanvasItemProps> = ({ component, onDrop, onSelect, isSelected, onUpdate, onDuplicate, selectedComponentId, activeViewport }) => {
  const [isHovering, setIsHovering] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const itemRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLTextAreaElement | HTMLInputElement>(null);
  
  // State for interactive components
  const [openAccordionItem, setOpenAccordionItem] = React.useState<string | null>(null);
  const [activeTabIndex, setActiveTabIndex] = React.useState<number>(component.content.activeTab || 0);
  const [activeSlideIndex, setActiveSlideIndex] = React.useState(0);

  const resolvedStyles = getResolvedStyles(component, activeViewport, VIEWPORTS);
  const currentViewportStyles = component.stylesByViewport[activeViewport.name];
  const isContainer = [ComponentType.Container, ComponentType.Card, ComponentType.Form, ComponentType.Fieldset].includes(component.type);

  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isContainer) {
        setIsHovering(true);
    }
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.stopPropagation();
    setIsHovering(false);
  };

  const handleItemDrop = (e: React.DragEvent) => {
      e.stopPropagation();
      setIsHovering(false);

      const droppedText = e.dataTransfer.getData('text/plain');
      const isComponentDrop = e.dataTransfer.getData('componentType') || e.dataTransfer.getData('sectionType');
      
      // Case 1: Drop text onto a text-like component to update it.
      if (droppedText && !isComponentDrop) {
          let contentKey: keyof PageComponent['content'] | null = null;
          if (component.type === ComponentType.Text || component.type === ComponentType.Button) {
              contentKey = component.type === ComponentType.Text ? 'text' : 'buttonText';
          }
          
          if (contentKey) {
              e.preventDefault();
              onUpdate(component.id, { content: { ...component.content, [contentKey]: droppedText } });
              return;
          }
      }

      // Case 2: Drop a component/section onto a container to add it as a child.
      if (isContainer) {
          onDrop(e, component.id);
          return;
      }
      
      // Case 3: Drop a component/section onto a non-container. It should be added to the canvas root.
      // We call the onDrop prop with a null parentId to signify a root-level drop.
      onDrop(e, null);
  };
  
  const handleMove = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).classList.contains('absolute') || isEditing) return;
    e.preventDefault();
    e.stopPropagation();
    onSelect(e, component.id); 

    if (!itemRef.current) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const startLeft = itemRef.current.offsetLeft;
    const startTop = itemRef.current.offsetTop;

    const doDrag = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;

      const newStylesForViewport: ViewportStyles = {
        ...(currentViewportStyles || resolvedStyles),
        base: {
            ...(currentViewportStyles?.base || resolvedStyles.base),
            left: `${startLeft + dx}px`,
            top: `${startTop + dy}px`,
        }
      }
      onUpdate(component.id, {
        stylesByViewport: {
            ...component.stylesByViewport,
            [activeViewport.name]: newStylesForViewport
        }
      });
    };

    const stopDrag = () => {
      window.removeEventListener('mousemove', doDrag);
      window.removeEventListener('mouseup', stopDrag);
    };

    window.addEventListener('mousemove', doDrag);
    window.addEventListener('mouseup', stopDrag);
  };

  const handleResize = (e: React.MouseEvent, direction: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!itemRef.current) return;
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = itemRef.current.offsetWidth;
    const startHeight = itemRef.current.offsetHeight;
    const startLeft = itemRef.current.offsetLeft;
    const startTop = itemRef.current.offsetTop;

    const doDrag = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      
      const newBaseStyles: Partial<ComponentStyles> = {};

      if (direction.includes('right')) newBaseStyles.width = `${Math.max(30, startWidth + dx)}px`;
      if (direction.includes('bottom')) newBaseStyles.height = `${Math.max(30, startHeight + dy)}px`;
      if (direction.includes('left')) {
        const newWidth = startWidth - dx;
        if (newWidth > 30) {
            newBaseStyles.width = `${newWidth}px`;
            newBaseStyles.left = `${startLeft + dx}px`;
        }
      }
      if (direction.includes('top')) {
        const newHeight = startHeight - dy;
        if (newHeight > 30) {
            newBaseStyles.height = `${newHeight}px`;
            newBaseStyles.top = `${startTop + dy}px`;
        }
      }

       const newStylesForViewport: ViewportStyles = {
        ...(currentViewportStyles || resolvedStyles),
        base: { ...(currentViewportStyles?.base || resolvedStyles.base), ...newBaseStyles }
      }
      
      onUpdate(component.id, {
        stylesByViewport: { ...component.stylesByViewport, [activeViewport.name]: newStylesForViewport }
      });
    };

    const stopDrag = () => { window.removeEventListener('mousemove', doDrag); window.removeEventListener('mouseup', stopDrag); };
    window.addEventListener('mousemove', doDrag);
    window.addEventListener('mouseup', stopDrag);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (component.type === ComponentType.Text || component.type === ComponentType.Button) { setIsEditing(true); } 
    else if (component.type === ComponentType.Container || component.type === ComponentType.Card) {
        const colors = STYLE_OPTIONS.backgroundColor.filter(c => !c.includes('transparent'));
        const currentBg = resolvedStyles.base.backgroundColor || '';
        const currentIndex = colors.indexOf(currentBg);
        const nextIndex = (currentIndex + 1) % colors.length;
        const newStylesForViewport: ViewportStyles = {
            ...(currentViewportStyles || resolvedStyles),
            base: { ...(currentViewportStyles?.base || resolvedStyles.base), backgroundColor: colors[nextIndex] }
        };
        onUpdate(component.id, { stylesByViewport: { ...component.stylesByViewport, [activeViewport.name]: newStylesForViewport } });
    }
  }

  const handleContentChange = (value: string) => {
    const contentKey = component.type === ComponentType.Text ? 'text' : 'buttonText';
    if(contentKey) onUpdate(component.id, { content: { ...component.content, [contentKey]: value } });
  };

  const handleInputBlur = () => setIsEditing(false);
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && component.type !== ComponentType.Text) setIsEditing(false);
    if (e.key === 'Escape') setIsEditing(false);
  };
  
  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // A normal click (without ctrl/meta) should always be prevented to allow selection.
    if (!e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        return;
    }

    // At this point, it's a Ctrl+Click or Meta+Click.
    if (component.linkUrl?.startsWith('page:')) {
        // Prevent even Ctrl+Click for internal links in the editor.
        e.preventDefault();
        alert("To navigate between pages, please use the Pages panel on the left. Ctrl+Click works for external URLs only.");
        return;
    }
    
    // For external URLs, the default behavior of the anchor tag (opening in new tab due to target="_blank") will happen.
  };

  const { top, left, width, height, zIndex } = resolvedStyles.base;
  const wrapperStyles: React.CSSProperties = { position: 'absolute', top, left, width, height, zIndex: zIndex ? parseInt(zIndex, 10) : 'auto' };

  const renderComponent = () => {
    const styles = resolvedStyles.base;
    if (isEditing && (component.type === ComponentType.Text || component.type === ComponentType.Button)) {
      const InputElement = component.type === ComponentType.Text ? 'textarea' : 'input';
      const editorClasses = [ 'w-full', 'h-full', 'bg-transparent', 'resize-none', 'focus:outline-none', 'border-none', styles.fontSize, styles.fontWeight, styles.textColor, component.type === 'Button' ? 'text-center' : '' ].filter(Boolean).join(' ');
      return <InputElement ref={inputRef as any} value={component.content.text || component.content.buttonText || ''} onChange={(e) => handleContentChange(e.target.value)} onBlur={handleInputBlur} onKeyDown={handleInputKeyDown} className={editorClasses} />;
    }

    const baseProps = { className: `w-full h-full min-h-[50px] transition-colors relative` };

    switch (component.type) {
      case ComponentType.Container: case ComponentType.Card: case ComponentType.Form:
        return ( <div {...baseProps} onDoubleClick={handleDoubleClick} > {component.children.length === 0 && <span className="text-xs text-gray-500 pointer-events-none absolute inset-0 flex items-center justify-center">Drop here</span>} {component.children.map(child => <CanvasItem key={child.id} component={child} onDrop={onDrop} onSelect={onSelect} isSelected={selectedComponentId === child.id} onUpdate={onUpdate} onDuplicate={onDuplicate} selectedComponentId={selectedComponentId} activeViewport={activeViewport} />)} </div> );
      case ComponentType.Fieldset:
        return ( <fieldset {...baseProps} className={`${baseProps.className} border-2 border-gray-500 p-2 pt-0`} > <legend className="px-2 text-sm text-gray-400">{component.content.legendText}</legend> {component.children.map(child => <CanvasItem key={child.id} component={child} onDrop={onDrop} onSelect={onSelect} isSelected={selectedComponentId === child.id} onUpdate={onUpdate} onDuplicate={onDuplicate} selectedComponentId={selectedComponentId} activeViewport={activeViewport} />)} </fieldset> );
      case ComponentType.Text: return <p className="w-full h-full" onDoubleClick={handleDoubleClick} dangerouslySetInnerHTML={{ __html: component.content.text || '' }} />;
      case ComponentType.Button: return <button className="w-full h-full" onDoubleClick={handleDoubleClick} dangerouslySetInnerHTML={{ __html: component.content.buttonText || '' }} />;
      case ComponentType.Image: return <img className="w-full h-full object-cover" src={component.content.imageUrl} alt={component.name} />;
      case ComponentType.Input: return <input className="w-full h-full p-2" type={component.content.inputType || 'text'} placeholder={component.content.placeholder} readOnly />;
      case ComponentType.Textarea: return <textarea className="w-full h-full p-2 resize-none" placeholder={component.content.placeholder} readOnly />;
      case ComponentType.Video: return <iframe className="w-full h-full" src={component.content.videoUrl} title={component.name} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>;
      case ComponentType.Divider: return <div className="w-full h-full" />;
      case ComponentType.Icon:
        const iconData = component.content.iconName ? ICON_LIBRARY[component.content.iconName] : null;
        return iconData ? <svg viewBox={iconData.viewBox} fill="currentColor" className="w-full h-full"><path d={iconData.path} /></svg> : <div className="w-full h-full flex items-center justify-center text-xs text-red-400">?</div>;
      case ComponentType.ProgressBar: return <div className="w-full h-full overflow-hidden"><div className="h-full" style={{ width: `${component.content.progress || 0}%`, transition: 'width 0.3s ease' }}/></div>;
      case ComponentType.Alert:
        const alertIconName = component.content.alertType?.toLowerCase() || 'info';
        const alertIcon = ICON_LIBRARY[alertIconName];
        return <div className="w-full h-full flex items-start gap-3">{alertIcon && <svg viewBox={alertIcon.viewBox} fill="currentColor" className="w-6 h-6 flex-shrink-0 mt-0.5"><path d={alertIcon.path} /></svg>}<span dangerouslySetInnerHTML={{ __html: component.content.alertText || '' }} /></div>;
      case ComponentType.Accordion:
        return <div className="w-full h-full space-y-2 overflow-hidden">{(component.content.accordionItems || []).map(item => { const isOpen = openAccordionItem === item.id; return <div key={item.id} className="border-b border-gray-600"><button onClick={() => setOpenAccordionItem(isOpen ? null : item.id)} className="w-full flex justify-between items-center p-3 text-left"><span dangerouslySetInnerHTML={{ __html: item.title }} /><span className={`transform transition-transform ${isOpen ? 'rotate-45' : ''}`}>+</span></button><div className={`px-3 overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96' : 'max-h-0'}`}><p className="py-2 text-sm" dangerouslySetInnerHTML={{ __html: item.content }} /></div></div>; })}</div>;
      case ComponentType.Tabs:
        return <div className="w-full h-full flex flex-col"><div className="flex border-b border-gray-600">{(component.content.tabs || []).map((tab, index) => <button key={tab.id} onClick={() => setActiveTabIndex(index)} className={`px-4 py-2 text-sm ${activeTabIndex === index ? 'border-b-2 border-blue-500 text-white' : 'text-gray-400'}`} dangerouslySetInnerHTML={{ __html: tab.title }} />)}</div><div className="relative flex-1 bg-black bg-opacity-10 p-2">{component.children.map((child, index) => <div key={child.id} style={{ display: index === activeTabIndex ? 'block' : 'none', position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}><CanvasItem component={child} onDrop={onDrop} onSelect={onSelect} isSelected={selectedComponentId === child.id} onUpdate={onUpdate} onDuplicate={onDuplicate} selectedComponentId={selectedComponentId} activeViewport={activeViewport} /></div>)}</div></div>;
      // New Components
      case ComponentType.Navbar: return <div className="w-full h-full flex items-center gap-4 px-4">{component.content.text && <span className="font-bold text-lg" dangerouslySetInnerHTML={{ __html: component.content.text }} />}{(component.content.navLinks || []).map(link => <a key={link.id} href={link.url} className="text-sm" dangerouslySetInnerHTML={{ __html: link.text }} />)}</div>;
      case ComponentType.Footer: return <div className="w-full h-full flex items-center justify-center text-center text-xs text-gray-400"><p dangerouslySetInnerHTML={{ __html: component.content.text || ''}} /></div>;
      case ComponentType.Label: return <label className="w-full h-full flex items-center" htmlFor={component.content.htmlFor} dangerouslySetInnerHTML={{ __html: component.content.text || ''}} />;
      case ComponentType.Checkbox: return <div className="w-full h-full flex items-center gap-2"><input type="checkbox" checked={!!component.content.checked} readOnly /><label>Checkbox</label></div>;
      case ComponentType.Radio: return <div className="w-full h-full flex items-center gap-2"><input type="radio" checked={!!component.content.checked} readOnly /><label>Radio</label></div>;
      case ComponentType.Select: return <select className="w-full h-full p-2">{component.content.selectOptions?.split(',').map(opt => <option key={opt}>{opt.trim()}</option>)}</select>;
      case ComponentType.Map: return <iframe className="w-full h-full" title={component.name} src={`https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=${encodeURIComponent(component.content.mapQuery || '')}`} />;
      case ComponentType.SocialIcons: return <div className="w-full h-full flex items-center gap-3">{(component.content.socialLinks || []).map(link => <a key={link.id} href={link.url}>{ICON_LIBRARY[link.network] && <svg viewBox={ICON_LIBRARY[link.network].viewBox} fill="currentColor" className="w-6 h-6"><path d={ICON_LIBRARY[link.network].path} /></svg>}</a>)}</div>;
      case ComponentType.Table: 
        const rows = (component.content.tableData || '').split('\n').map(row => row.split(','));
        return <table className="w-full h-full border-collapse"><tbody>{rows.map((row, i) => <tr key={i}>{row.map((cell, j) => i === 0 ? <th key={j} className="border p-2 border-gray-600">{cell}</th> : <td key={j} className="border p-2 border-gray-600">{cell}</td>)}</tr>)}</tbody></table>;
      case ComponentType.List:
        const ListEl = component.content.listType === 'ordered' ? 'ol' : 'ul';
        return <ListEl className="w-full h-full list-inside list-disc space-y-1 p-2">{(component.content.listItems || '').split('\n').map((item, i) => <li key={i} dangerouslySetInnerHTML={{ __html: item }} />)}</ListEl>;
      case ComponentType.Blockquote: return <blockquote className="w-full h-full p-4 border-l-4 border-gray-500 italic"><p dangerouslySetInnerHTML={{ __html: component.content.quote || '' }} /><footer className="mt-2 text-sm not-italic" dangerouslySetInnerHTML={{ __html: `- ${component.content.cite || ''}` }} /></blockquote>;
      case ComponentType.Spinner: return <div className="w-full h-full border-4 border-gray-600 border-t-blue-500 rounded-full animate-spin" />;
      case ComponentType.Rating:
        return <div className="w-full h-full flex items-center gap-1">{[...Array(component.content.maxRating || 5)].map((_, i) => <svg key={i} className={`w-6 h-6 ${i < (component.content.rating || 0) ? 'text-yellow-400' : 'text-gray-600'}`} fill="currentColor" viewBox={ICON_LIBRARY.star.viewBox}><path d={ICON_LIBRARY.star.path} /></svg>)}</div>;
      case ComponentType.Carousel:
        const images = component.content.carouselImages || [];
        return <div className="w-full h-full relative overflow-hidden"> {images.map((img, i) => <img key={img.id} src={img.src} alt={img.alt} className="absolute w-full h-full object-cover transition-opacity duration-500" style={{ opacity: i === activeSlideIndex ? 1 : 0 }} />)} {images.length > 1 && <> <button onClick={() => setActiveSlideIndex(i => (i - 1 + images.length) % images.length)} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 p-2 rounded-full text-white">‹</button> <button onClick={() => setActiveSlideIndex(i => (i + 1) % images.length)} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 p-2 rounded-full text-white">›</button> </>} </div>;
      default: return null;
    }
  };
  
  const resizeHandles = [ { position: 'top-[-6px] left-1/2 -translate-x-1/2', cursor: 'cursor-ns-resize', direction: 'top' }, { position: 'bottom-[-6px] left-1/2 -translate-x-1/2', cursor: 'cursor-ns-resize', direction: 'bottom' }, { position: 'left-[-6px] top-1/2 -translate-y-1/2', cursor: 'cursor-ew-resize', direction: 'left' }, { position: 'right-[-6px] top-1/2 -translate-y-1/2', cursor: 'cursor-ew-resize', direction: 'right' }, { position: 'top-[-6px] left-[-6px]', cursor: 'cursor-nwse-resize', direction: 'top-left' }, { position: 'top-[-6px] right-[-6px]', cursor: 'cursor-nesw-resize', direction: 'top-right' }, { position: 'bottom-[-6px] left-[-6px]', cursor: 'cursor-nesw-resize', direction: 'bottom-left' }, { position: 'bottom-[-6px] right-[-6px]', cursor: 'cursor-nwse-resize', 'direction': 'bottom-right' }, ];
  const selectionOutline = isSelected ? 'outline outline-2 outline-offset-2 outline-blue-500' : '';
  const hoverOutline = isHovering && isContainer ? 'outline outline-2 outline-offset-0 outline-blue-400 opacity-80' : '';
  const CoreComponent = (
    <div 
        id={component.id} 
        ref={itemRef} 
        style={wrapperStyles} 
        onMouseDown={handleMove} 
        onClick={(e) => onSelect(e, component.id)}
        onDrop={handleItemDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`cursor-grab active:cursor-grabbing ${selectionOutline} ${hoverOutline}`}> 
        {isSelected && <> <FloatingToolbar component={component} onUpdate={onUpdate} onDuplicate={onDuplicate} /> {resizeHandles.map(h => <Resizer key={h.direction} className={`${h.position} ${h.cursor}`} onMouseDown={e => handleResize(e, h.direction)} />)} </>} 
        {renderComponent()} 
    </div>
  );
  return component.linkUrl && !isEditing 
    ? <a href={component.linkUrl} onClick={handleLinkClick} target="_blank" rel="noopener noreferrer" title={`Link: ${component.linkUrl} (Ctrl+Click to open)`} className="contents">{CoreComponent}</a> 
    : CoreComponent;
};

export default CanvasItem;