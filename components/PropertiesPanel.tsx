import React from 'react';
import { createNewComponent, STYLE_OPTIONS, VIEWPORTS, ICON_LIBRARY } from '../constants';
import { ComponentType } from '../types';
import type { PageComponent, ComponentStyles, DropdownOption, Viewport, ViewportStyles, AccordionItem, Tab, Page, NavLink, SocialLink, CarouselImage } from '../types';
import { getResolvedStyles } from '../utils/styleResolver';
import ColorInput from './ColorInput';

type StyleState = 'base' | 'hover';

interface PropertiesPanelProps {
  pages: Page[];
  component: PageComponent | null;
  onUpdate: (id: string, newProps: Partial<PageComponent>) => void;
  activeViewport: Viewport;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ pages, component, onUpdate, activeViewport }) => {
  const [styleState, setStyleState] = React.useState<StyleState>('base');
  const [isEventsOpen, setIsEventsOpen] = React.useState(false);
  const [isAttributesOpen, setIsAttributesOpen] = React.useState(true);
  const isHoverEditing = styleState === 'hover';

  React.useEffect(() => { setStyleState('base'); }, [component?.id, activeViewport.name]);

  if (!component) {
    return <div className="w-80 bg-slate-800 p-4 flex items-center justify-center"><p className="text-slate-500">Select a component to edit</p></div>;
  }
  
  const isFormComponent = [ComponentType.Input, ComponentType.Textarea, ComponentType.Select, ComponentType.Checkbox, ComponentType.Radio].includes(component.type);

  const resolvedStyles = getResolvedStyles(component, activeViewport, VIEWPORTS);
  const currentViewportStyles = component.stylesByViewport[activeViewport.name];

  const handleStyleChange = (style: keyof ComponentStyles, value: string) => {
    const currentStylesForState = (currentViewportStyles && currentViewportStyles[styleState]) || resolvedStyles[styleState];
    const newViewportStyle: ViewportStyles = { ...(currentViewportStyles || resolvedStyles), [styleState]: { ...currentStylesForState, [style]: value } };
    onUpdate(component.id, { stylesByViewport: { ...component.stylesByViewport, [activeViewport.name]: newViewportStyle } });
  };
  
  const handleAddCommonHoverEffect = () => {
    if (!component) return;
    const currentVPStyles = component.stylesByViewport[activeViewport.name] || { base: {} };
    const newViewportStyle: ViewportStyles = { base: currentVPStyles.base, hover: { ...currentVPStyles.hover, backgroundColor: 'bg-slate-700', textColor: 'text-white' } };
    onUpdate(component.id, { stylesByViewport: { ...component.stylesByViewport, [activeViewport.name]: newViewportStyle } });
  };

  const handleContentChange = (key: string, value: any) => onUpdate(component.id, { content: { ...component.content, [key]: value } });
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => onUpdate(component.id, { name: e.target.value });
  const handleEventChange = (event: keyof NonNullable<PageComponent['events']>, code: string) => {
    onUpdate(component.id, { events: { ...component.events, [event]: code } });
  };

  const renderSelect = (label: string, style: keyof ComponentStyles, options: string[]) => (
    <div key={style}>
      <label className="block text-sm font-medium text-slate-400 mb-1">{label}</label>
      <select value={resolvedStyles[styleState]?.[style] || ''} onChange={(e) => handleStyleChange(style, e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition">
        <option value="">Default</option>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
  );

  const renderTextInputStyle = (label: string, style: keyof ComponentStyles, placeholder?: string, type: string = 'text') => (
    <div key={style}>
      <label className="block text-sm font-medium text-slate-400 mb-1">{label}</label>
      <input type={type} value={resolvedStyles[styleState]?.[style] || ''} onChange={(e) => handleStyleChange(style, e.target.value)} placeholder={placeholder} className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition" />
    </div>
  );
  
  const renderContentInput = (label: string, contentKey: keyof PageComponent['content'], placeholder?: string) => (
    <div><label className="block text-sm font-medium text-slate-400 mb-1">{label}</label><input type="text" value={component.content[contentKey] as string || ''} onChange={(e) => handleContentChange(contentKey, e.target.value)} placeholder={placeholder} className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition" /></div>
  );
  
  const renderContentTextarea = (label: string, contentKey: keyof PageComponent['content'], placeholder?: string) => (
    <div><label className="block text-sm font-medium text-slate-400 mb-1">{label}</label><textarea value={component.content[contentKey] as string || ''} onChange={(e) => handleContentChange(contentKey, e.target.value)} placeholder={placeholder} className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-sm h-24 resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition" /></div>
  );

  const renderManager = <T extends {id: string}>(title: string, items: T[], onUpdateItems: (items: T[]) => void, renderItem: (item: T, onUpdate: (updatedItem: T) => void, onRemove: () => void) => React.ReactNode, newItem: T) => (
    <div>
        <h4 className="text-md font-semibold border-b border-slate-700 pb-2 mt-4">{title}</h4>
        <div className="space-y-2 mt-2">
            {items.map(item => (
                <div key={item.id} className="p-2 bg-slate-900 rounded-md space-y-2">
                    {renderItem(item, (updatedItem) => onUpdateItems(items.map(i => i.id === item.id ? updatedItem : i)), () => onUpdateItems(items.filter(i => i.id !== item.id)))}
                </div>
            ))}
        </div>
        <button onClick={() => onUpdateItems([...items, {...newItem, id: `${title.toLowerCase()}-${Date.now()}`}])} className="mt-2 text-sm text-indigo-400 hover:text-indigo-300 font-semibold">+ Add Item</button>
    </div>
  );
  
  return (
    <div className="w-80 bg-slate-800 p-4 overflow-y-auto">
      <h3 className="text-lg font-bold mb-4">{isHoverEditing ? 'Editing Hover State' : 'Properties'}</h3>
      <p className="text-xs text-indigo-300 bg-indigo-900/50 p-2 rounded-md mb-4">You are editing styles for the <span className="font-bold">{activeViewport.name}</span> view.</p>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">State</label>
          <select value={styleState} onChange={(e) => setStyleState(e.target.value as StyleState)} className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-sm"><option value="base">Default</option><option value="hover">Hover</option></select>
          <button onClick={handleAddCommonHoverEffect} className="mt-2 w-full text-center px-3 py-1.5 text-xs rounded bg-indigo-600 hover:bg-indigo-700 transition-colors font-semibold">Add Common Hover Effect</button>
        </div>
        
        <div className={isHoverEditing ? 'opacity-50 pointer-events-none' : ''}>
            <div><label className="block text-sm font-medium text-slate-400 mb-1">Component Name</label><input type="text" value={component.name} onChange={handleNameChange} className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-sm" /></div>
            <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Link URL</label>
                <div className="flex gap-2"><input type="text" value={component.linkUrl || ''} onChange={(e) => onUpdate(component.id, {linkUrl: e.target.value})} placeholder="https://example.com" className="flex-1 bg-slate-700 border border-slate-600 rounded-md p-2 text-sm" disabled={component.linkUrl?.startsWith('page:')} /><select value={component.linkUrl?.startsWith('page:') ? component.linkUrl : 'external'} onChange={(e) => onUpdate(component.id, { linkUrl: e.target.value === 'external' ? '' : e.target.value })} className="bg-slate-700 border border-slate-600 rounded-md p-2 text-sm max-w-[100px]"><option value="external">External</option><optgroup label="Internal Pages">{pages.map(page => <option key={page.id} value={`page:${page.id}`}>{page.name}</option>)}</optgroup></select></div>
            </div>
            {component.type === 'Image' && <div><label className="block text-sm font-medium text-slate-400 mb-1">Image Source</label><input type="text" value={component.content.imageUrl || ''} onChange={(e) => handleContentChange('imageUrl', e.target.value)} placeholder="Image URL" className="w-full bg-slate-700 p-2 text-sm" /></div>}
            {component.type === 'Video' && renderContentInput('Video URL', 'videoUrl', 'e.g., YouTube embed URL')}
            {component.type === 'Map' && renderContentInput('Map Query', 'mapQuery', 'e.g., Eiffel Tower')}
            {(component.type === 'Input' || component.type === 'Textarea') && renderContentInput('Placeholder', 'placeholder')}
            {component.type === 'Label' && renderContentInput('For Input ID', 'htmlFor')}
            {component.type === 'Fieldset' && renderContentInput('Legend Text', 'legendText')}
            {component.type === 'Checkbox' && <div><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!component.content.checked} onChange={e => handleContentChange('checked', e.target.checked)} /> Is checked?</label></div>}
            {component.type === 'Radio' && <div><label className="flex items-center gap-2 text-sm"><input type="radio" checked={!!component.content.checked} onChange={e => handleContentChange('checked', e.target.checked)} /> Is selected?</label></div>}
            {component.type === 'Select' && renderContentInput('Options (comma-sep)', 'selectOptions')}
            {component.type === 'Table' && renderContentTextarea('Table Data (CSV)', 'tableData', 'Header1,Header2\nRow1Cell1,Row1Cell2')}
            {component.type === 'List' && <>{renderContentTextarea('List Items (one per line)', 'listItems')}<select value={component.content.listType || 'unordered'} onChange={e => handleContentChange('listType', e.target.value as 'ordered' | 'unordered')} className="w-full bg-slate-700 p-2 text-sm mt-2"><option value="unordered">Unordered (Bullets)</option><option value="ordered">Ordered (Numbers)</option></select></>}
            {component.type === 'Blockquote' && <>{renderContentInput('Quote', 'quote')}{renderContentInput('Citation', 'cite')}</>}
            {component.type === 'Rating' && <><label className="block text-sm">Rating: {component.content.rating}/{component.content.maxRating}</label><input type="range" min="0" max={component.content.maxRating || 5} value={component.content.rating || 0} onChange={e => handleContentChange('rating', parseInt(e.target.value))} /><label>Max Rating:</label><input type="number" min="1" value={component.content.maxRating || 5} onChange={e => handleContentChange('maxRating', parseInt(e.target.value))} /></>}
            {component.type === 'Navbar' && renderManager('Nav Links', component.content.navLinks || [], (items) => handleContentChange('navLinks', items), (item, onUpdate, onRemove) => <> <input type="text" value={item.text} onChange={e => onUpdate({ ...item, text: e.target.value })} placeholder="Link Text" /> <input type="text" value={item.url} onChange={e => onUpdate({ ...item, url: e.target.value })} placeholder="URL" /> <button onClick={onRemove}>Remove</button> </>, { id: '', text: 'New Link', url: '#' })}
            {component.type === 'Footer' && renderManager('Footer Links', component.content.navLinks || [], (items) => handleContentChange('navLinks', items), (item, onUpdate, onRemove) => <> <input type="text" value={item.text} onChange={e => onUpdate({ ...item, text: e.target.value })} placeholder="Link Text" /> <input type="text" value={item.url} onChange={e => onUpdate({ ...item, url: e.target.value })} placeholder="URL" /> <button onClick={onRemove}>Remove</button> </>, { id: '', text: 'New Link', url: '#' })}
            {component.type === 'SocialIcons' && renderManager('Social Links', component.content.socialLinks || [], (items) => handleContentChange('socialLinks', items), (item, onUpdate, onRemove) => <><select value={item.network} onChange={e => onUpdate({ ...item, network: e.target.value as any })}> {['facebook', 'twitter', 'instagram', 'linkedin', 'github'].map(n => <option key={n} value={n}>{n}</option>)} </select> <input type="text" value={item.url} onChange={e => onUpdate({ ...item, url: e.target.value })} placeholder="URL" /> <button onClick={onRemove}>Remove</button></>, { id: '', network: 'facebook', url: '#' })}
            {component.type === 'Carousel' && renderManager('Carousel Images', component.content.carouselImages || [], (items) => handleContentChange('carouselImages', items), (item, onUpdate, onRemove) => <> <input type="text" value={item.src} onChange={e => onUpdate({ ...item, src: e.target.value })} placeholder="Image URL" /> <input type="text" value={item.alt} onChange={e => onUpdate({ ...item, alt: e.target.value })} placeholder="Alt Text" /> <button onClick={onRemove}>Remove</button> </>, { id: '', src: 'https://picsum.photos/600/400', alt: 'New Image' })}

            {component.type === 'Form' && <> <h4 className="text-md font-semibold border-b border-slate-700 pb-2 mt-4">Form Settings</h4> {renderContentInput('Action', 'formAction')} <label className="block text-sm font-medium text-slate-400 mb-1">Method</label> <select value={component.content.formMethod || 'POST'} onChange={e=>handleContentChange('formMethod', e.target.value)} className="w-full bg-slate-700 p-2 text-sm"> <option>POST</option> <option>GET</option> </select> <label className="block text-sm font-medium text-slate-400 mb-1 mt-2">Encoding Type</label> <select value={component.content.formEnctype} onChange={e=>handleContentChange('formEnctype', e.target.value)} className="w-full bg-slate-700 p-2 text-sm"> <option value="application/x-www-form-urlencoded">application/x-www-form-urlencoded</option> <option value="multipart/form-data">multipart/form-data</option> <option value="text/plain">text/plain</option> </select> </> }
            {component.type === 'Input' && <> <h4 className="text-md font-semibold border-b border-slate-700 pb-2 mt-4">Input Settings</h4> <label className="block text-sm font-medium text-slate-400 mb-1">Input Type</label> <select value={component.content.inputType || 'text'} onChange={e=>handleContentChange('inputType', e.target.value)} className="w-full bg-slate-700 p-2 text-sm"> {['text', 'password', 'email', 'number', 'date', 'file'].map(t => <option key={t} value={t}>{t}</option>)} </select> </> }

            {isFormComponent && (
                <>
                    <div className="border-b border-slate-700 mt-4">
                         <button onClick={() => setIsAttributesOpen(!isAttributesOpen)} className="w-full flex justify-between items-center py-2 text-md font-semibold">
                             <span>Attributes</span>
                             <span className={`transform transition-transform ${isAttributesOpen ? 'rotate-180' : ''}`}>&#9660;</span>
                         </button>
                    </div>
                    {isAttributesOpen && <div className="space-y-2 mt-2">
                        {renderContentInput('Name', 'inputName')}
                        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!component.content.isRequired} onChange={e=>handleContentChange('isRequired', e.target.checked)} /> Required</label>
                        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={component.content.autocomplete === 'on'} onChange={e=>handleContentChange('autocomplete', e.target.checked ? 'on' : 'off')} /> Autocomplete</label>
                    </div>}
                </>
            )}

        </div>

        <div className={isHoverEditing ? 'opacity-50 pointer-events-none' : ''}>
            <h4 className="text-md font-semibold border-b border-slate-700 pb-2 mt-4">Layout</h4>
            <div className="grid grid-cols-2 gap-2">{renderTextInputStyle('X Position', 'left')}{renderTextInputStyle('Y Position', 'top')}</div>
            <div className="grid grid-cols-2 gap-2 mt-2">{renderTextInputStyle('Width', 'width')}{renderTextInputStyle('Height', 'height')}</div>
            <div className="mt-2">{renderTextInputStyle('Z-Index', 'zIndex', 'auto', 'number')}</div>
            <div className="mt-2">{renderSelect('Padding', 'padding', STYLE_OPTIONS.padding)}</div>
        </div>
        
        <h4 className="text-md font-semibold border-b border-slate-700 pb-2 mt-4">Appearance</h4>
        <ColorInput label="Background Color" value={resolvedStyles[styleState]?.backgroundColor || ''} onChange={val => handleStyleChange('backgroundColor', val)} colorOptions={STYLE_OPTIONS.backgroundColor} />
        <ColorInput label="Text Color" value={resolvedStyles[styleState]?.textColor || ''} onChange={val => handleStyleChange('textColor', val)} colorOptions={STYLE_OPTIONS.textColor} />
        {component.type === 'ProgressBar' && <ColorInput label="Bar Color" value={resolvedStyles[styleState]?.barColor || ''} onChange={val => handleStyleChange('barColor', val)} colorOptions={STYLE_OPTIONS.backgroundColor} />}
        {renderSelect('Border Radius', 'borderRadius', STYLE_OPTIONS.borderRadius)}
        {renderSelect('Box Shadow', 'boxShadow', STYLE_OPTIONS.boxShadow)}
        
        <h4 className="text-md font-semibold border-b border-slate-700 pb-2 mt-4">Typography</h4>
        {renderSelect('Font Size', 'fontSize', STYLE_OPTIONS.fontSize)}
        {renderSelect('Font Weight', 'fontWeight', STYLE_OPTIONS.fontWeight)}
        {component.type === 'Text' && renderSelect('Decoration', 'textDecoration', STYLE_OPTIONS.textDecoration)}
        
        <div className={isHoverEditing ? 'opacity-50 pointer-events-none' : ''}>
            <div className="border-b border-slate-700 mt-4">
                <button onClick={() => setIsEventsOpen(!isEventsOpen)} className="w-full flex justify-between items-center py-2 text-md font-semibold">
                    <span>Events</span>
                    <span className={`transform transition-transform ${isEventsOpen ? 'rotate-180' : ''}`}>&#9660;</span>
                </button>
            </div>
            {isEventsOpen && (
                <div className="space-y-2 mt-2">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">On Click (onclick)</label>
                        <textarea value={component.events?.onclick || ''} onChange={(e) => handleEventChange('onclick', e.target.value)} placeholder="e.g., alert('Hello World!')" className="w-full bg-slate-900 border border-slate-600 rounded-md p-2 text-sm h-20 resize-y font-mono" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">On Mouse Over (onmouseover)</label>
                        <textarea value={component.events?.onmouseover || ''} onChange={(e) => handleEventChange('onmouseover', e.target.value)} placeholder="e.g., console.log('Hovering!')" className="w-full bg-slate-900 border border-slate-600 rounded-md p-2 text-sm h-20 resize-y font-mono" />
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default PropertiesPanel;