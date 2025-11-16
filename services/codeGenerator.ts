import type { PageComponent, ComponentStyles, Page, ThemeStyles, Viewport, ProjectSettings } from '../types';
import { VIEWPORTS, ICON_LIBRARY, STYLE_OPTIONS } from '../constants';

const tailwindToCssMap: Record<string, Record<string, string>> = {
  padding: { 'p-0': '0', 'p-1': '0.25rem', 'p-2': '0.5rem', 'p-4': '1rem', 'p-6': '1.5rem', 'p-8': '2rem' },
  margin: { 'm-0': '0', 'm-1': '0.25rem', 'm-2': '0.5rem', 'm-4': '1rem', 'm-6': '1.5rem', 'm-8': '2rem', 'mt-8': 'margin-top: 2rem;', 'mb-8': 'margin-bottom: 2rem;' },
  width: { 'w-auto': 'auto', 'w-full': '100%', 'w-1/2': '50%', 'w-1/3': '33.333333%', 'w-1/4': '25%', 'w-screen': '100vw' },
  height: { 'h-auto': 'auto', 'h-full': '100%', 'h-1/2': '50%', 'h-1/3': '33.333333%', 'h-1/4': '25%', 'h-screen': '100vh', 'h-96': '24rem' },
  backgroundColor: STYLE_OPTIONS.backgroundColor.reduce((acc, val) => { const colorMap: Record<string, string> = { 'transparent': 'transparent', 'white': '#ffffff', 'black': '#000000', 'gray-100': '#f3f4f6', 'gray-200': '#e5e7eb', 'gray-300': '#d1d5db', 'gray-400': '#9ca3af', 'gray-500': '#6b7280', 'gray-600': '#4b5563', 'gray-700': '#374151', 'gray-800': '#1f2937', 'gray-900': '#111827', 'red-500': '#ef4444', 'orange-500': '#f97316', 'yellow-500': '#eab308', 'green-500': '#22c55e', 'teal-500': '#14b8a6', 'blue-500': '#3b82f6', 'indigo-500': '#6366f1', 'purple-500': '#8b5cf6', 'pink-500': '#ec4899', 'red-600': '#dc2626', 'orange-600': '#ea580c', 'yellow-600': '#ca8a04', 'green-600': '#16a34a', 'teal-600': '#0d9488', 'blue-600': '#2563eb', 'indigo-600': '#4f46e5', 'purple-600': '#7c3aed', 'pink-600': '#db2777' }; const key = val.replace('bg-', ''); if (colorMap[key]) acc[val] = colorMap[key]; return acc; }, {} as Record<string, string>),
  textColor: STYLE_OPTIONS.textColor.reduce((acc, val) => { const colorMap: Record<string, string> = { 'inherit': 'inherit', 'white': '#ffffff', 'black': '#000000', 'gray-100': '#f3f4f6', 'gray-200': '#e5e7eb', 'gray-300': '#d1d5db', 'gray-400': '#9ca3af', 'gray-500': '#6b7280', 'gray-600': '#4b5563', 'gray-700': '#374151', 'gray-800': '#1f2937', 'gray-900': '#111827', 'red-500': '#ef4444', 'orange-500': '#f97316', 'yellow-500': '#eab308', 'green-500': '#22c55e', 'teal-500': '#14b8a6', 'blue-500': '#3b82f6', 'indigo-500': '#6366f1', 'purple-500': '#8b5cf6', 'pink-500': '#ec4899', 'red-400': '#f87171', 'orange-400': '#fb923c', 'yellow-400': '#facc15', 'green-400': '#4ade80', 'teal-400': '#2dd4bf', 'blue-400': '#60a5fa', 'indigo-400': '#818cf8', 'purple-400': '#a78bfa', 'pink-400': '#f472b6' }; const key = val.replace('text-', ''); if (colorMap[key]) acc[val] = colorMap[key]; return acc; }, {} as Record<string, string>),
  fontSize: { 'text-xs': '0.75rem', 'text-sm': '0.875rem', 'text-base': '1rem', 'text-lg': '1.125rem', 'text-xl': '1.25rem', 'text-2xl': '1.5rem', 'text-4xl': '2.25rem' },
  fontWeight: { 'font-light': '300', 'font-normal': '400', 'font-medium': '500', 'font-semibold': '600', 'font-bold': '700' },
  textDecoration: { 'none': 'none', 'underline': 'underline', 'line-through': 'line-through', 'overline': 'overline' },
  borderRadius: { 'rounded-none': '0px', 'rounded-sm': '0.125rem', 'rounded': '0.25rem', 'rounded-md': '0.375rem', 'rounded-lg': '0.5rem', 'rounded-full': '9999px' },
  boxShadow: { 'shadow-none': '0 0 #0000', 'shadow-sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)', 'shadow-md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', 'shadow-lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', 'shadow-xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)', 'shadow-2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)', 'shadow-inner': 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)' },
};

const styleKeyToCssProperty: Record<keyof Omit<ComponentStyles, 'borderColor'>, string> = { top: 'top', left: 'left', zIndex: 'z-index', padding: 'padding', margin: 'margin', width: 'width', height: 'height', minHeight: 'min-height', backgroundColor: 'background-color', textColor: 'color', barColor: '--bar-color', fontSize: 'font-size', fontWeight: 'font-weight', textDecoration: 'text-decoration', border: 'border', borderRadius: 'border-radius', boxShadow: 'box-shadow' };
const getPageFileName = (page: Page, isIndex: boolean): string => isIndex ? 'index.html' : `${page.name.toLowerCase().replace(/\s+/g, '-') || 'page'}.html`;

const generateCssRulesForStyles = (styles: Partial<ComponentStyles>): string => {
    let cssRules = '';
    const styleEntries = Object.entries(styles) as [keyof ComponentStyles, string][];
    styleEntries.forEach(([key, value]) => {
        if (!value || key === 'borderColor') return;
        const cssProperty = styleKeyToCssProperty[key as keyof typeof styleKeyToCssProperty];
        if (!cssProperty) return;
        if (value.startsWith('#')) cssRules += `  ${cssProperty}: ${value};\n`;
        else if (tailwindToCssMap[key as keyof typeof tailwindToCssMap]?.[value]) {
            const cssValue = tailwindToCssMap[key as keyof typeof tailwindToCssMap][value];
            if (cssValue.includes(':')) {
                cssRules += `  ${cssValue}\n`;
            } else {
                cssRules += `  ${cssProperty}: ${cssValue};\n`;
            }
        }
        else if (key === 'border') {
            const borderColorClass = styles.borderColor || 'border-gray-500';
            // FIX: Use tailwindToCssMap.backgroundColor instead of undefined tailwindColorClassToHex
            const borderColorValue = tailwindToCssMap.backgroundColor[borderColorClass.replace('border-', 'bg-')] || '#6b7280';
            cssRules += `  border: 1px solid ${borderColorValue};\n`;
            if (value.includes('dashed')) cssRules += `  border-style: dashed;\n`;
        } else cssRules += `  ${cssProperty}: ${value};\n`;
    });
    return cssRules;
}

export const generateCssForLayout = (layout: PageComponent[]): string => {
  let allCss = '';
  const traverse = (components: PageComponent[]) => {
    for (const component of components) {
        Object.keys(component.stylesByViewport).forEach(viewportName => {
            const viewport = VIEWPORTS.find(v => v.name === viewportName);
            const viewportStyles = component.stylesByViewport[viewportName];
            let mediaQueryCss = '';
            
            if (viewportStyles.base) {
                const baseRules = generateCssRulesForStyles(viewportStyles.base);
                if (baseRules) {
                    const cssBlock = `\n#${component.id} {\n  position: absolute;\n${baseRules}}\n`;
                    if (viewportName === 'Desktop') {
                        allCss += cssBlock;
                    } else {
                        mediaQueryCss += cssBlock;
                    }
                }
            }
            if (viewportStyles.hover) {
                const hoverRules = generateCssRulesForStyles(viewportStyles.hover);
                if (hoverRules) {
                    const cssBlock = `\n#${component.id}:hover {\n${hoverRules}}\n`;
                     if (viewportName === 'Desktop') {
                        allCss += cssBlock;
                    } else {
                        mediaQueryCss += cssBlock;
                    }
                }
            }
            
            if (mediaQueryCss && viewport && viewport.name !== 'Desktop') {
                allCss += `\n@media (max-width: ${viewport.breakpoint}px) {${mediaQueryCss}}\n`;
            }
        });

        if (component.type === 'ProgressBar') allCss += `\n#${component.id} .progress-bar-inner { width: ${component.content.progress}%; height: 100%; background-color: var(--bar-color, #2563eb); border-radius: inherit; transition: width 0.3s ease; }\n`;
        if (component.type === 'Alert') allCss += `\n#${component.id} { display: flex; align-items: flex-start; gap: 0.75rem; }\n`;
        if (component.type === 'Spinner') allCss += `#${component.id} { border: 4px solid #4b5563; border-top-color: #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`;
        if (component.children?.length > 0) traverse(component.children);
    }
  };
  traverse(layout);
  return allCss;
};

const generateHtmlForComponent = (component: PageComponent, pages: Page[], isProjectExport: boolean): string => {
  const idAttr = `id="${component.id}"`;
  const childrenHtml = component.children.map(child => generateHtmlForComponent(child, pages, isProjectExport)).join('\n');
  const eventAttrs = Object.entries(component.events || {}).map(([event, code]) => code ? `${event}="${code.replace(/"/g, '&quot;')}"` : '').join(' ');
  
  const formAttrs = [
      component.content.inputName ? `name="${component.content.inputName}"` : '',
      component.content.isRequired ? 'required' : '',
      component.content.autocomplete ? `autocomplete="${component.content.autocomplete}"` : '',
  ].filter(Boolean).join(' ');
  
  const allAttrs = `${idAttr} ${eventAttrs} ${formAttrs}`.trim();

  let elementHtml = '';
  switch (component.type) {
    case 'Container': case 'Card': elementHtml = `<div ${allAttrs}>${childrenHtml}</div>`; break;
    case 'Form': elementHtml = `<form id="${component.id}" action="${component.content.formAction || '#'}" method="${component.content.formMethod || 'POST'}" enctype="${component.content.formEnctype || ''}" ${eventAttrs}>${childrenHtml}</form>`; break;
    case 'Fieldset': elementHtml = `<fieldset ${allAttrs}><legend>${component.content.legendText || ''}</legend>${childrenHtml}</fieldset>`; break;
    case 'Text': elementHtml = `<p ${allAttrs}>${component.content.text || ''}</p>`; break;
    case 'Button': elementHtml = `<button ${allAttrs}>${component.content.buttonText || ''}</button>`; break;
    case 'Image': elementHtml = `<img ${allAttrs} src="${encodeURI(component.content.imageUrl || 'https://picsum.photos/200')}" alt="${component.name}" />`; break;
    case 'Input': elementHtml = `<input ${allAttrs} type="${component.content.inputType || 'text'}" placeholder="${component.content.placeholder || ''}" />`; break;
    case 'Textarea': elementHtml = `<textarea ${allAttrs} placeholder="${component.content.placeholder || ''}"></textarea>`; break;
    case 'Video': elementHtml = `<iframe ${allAttrs} src="${encodeURI(component.content.videoUrl || '')}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`; break;
    case 'Divider': elementHtml = `<hr ${allAttrs} />`; break;
    case 'Icon': case 'Alert':
        let iconName = component.content.iconName;
        if(component.type === 'Alert') iconName = component.content.alertType?.toLowerCase() || 'info';
        const iconData = iconName ? ICON_LIBRARY[iconName] : null;
        if (iconData) {
            const iconSvg = `<svg viewBox="${iconData.viewBox}" fill="currentColor" width="24px" height="24px" style="flex-shrink: 0;"><path d="${iconData.path}" /></svg>`;
            elementHtml = component.type === 'Alert' ? `<div ${allAttrs}>${iconSvg}<span>${component.content.alertText || ''}</span></div>` : `<div ${allAttrs}>${iconSvg}</div>`;
        } else elementHtml = `<!-- Icon not found: ${iconName} -->`;
        break;
    case 'ProgressBar': elementHtml = `<div ${allAttrs}><div class="progress-bar-inner"></div></div>`; break;
    case 'Dropdown':
        const optionsHtml = (component.content.dropdownOptions || []).map(opt => `<li><a href="${encodeURI(opt.url)}">${opt.label}</a></li>`).join('\n');
        elementHtml = `<div ${allAttrs} class="dropdown-container"><button class="dropdown-button">Dropdown &#9662;</button><ul class="dropdown-content">${optionsHtml}</ul></div>`; break;
    case 'Accordion':
        elementHtml = `<div ${allAttrs} class="accordion-container">${(component.content.accordionItems || []).map(item => `<div class="accordion-item"><button class="accordion-title"><span>${item.title}</span><span class="accordion-icon">&plus;</span></button><div class="accordion-content"><p>${item.content}</p></div></div>`).join('\n')}</div>`; break;
    case 'Tabs':
        const tabButtonsHtml = (component.content.tabs || []).map((tab, index) => `<button class="tab-button ${index === 0 ? 'active' : ''}" data-tab-index="${index}">${tab.title}</button>`).join('\n');
        const tabContentHtml = component.children.map((child, index) => `<div class="tab-content ${index === 0 ? 'active' : ''}" data-tab-content="${index}">${generateHtmlForComponent(child, pages, isProjectExport)}</div>`).join('\n');
        elementHtml = `<div ${allAttrs} class="tabs-container"><div class="tabs-nav">${tabButtonsHtml}</div><div class="tabs-content-wrapper">${tabContentHtml}</div></div>`; break;
    case 'Navbar': case 'Footer': elementHtml = `<nav ${allAttrs}>${(component.content.navLinks || []).map(link => `<a href="${encodeURI(link.url)}">${link.text}</a>`).join('')}</nav>`; break;
    case 'Label': elementHtml = `<label ${allAttrs} for="${component.content.htmlFor || ''}">${component.content.text || ''}</label>`; break;
    case 'Checkbox': elementHtml = `<input ${allAttrs} type="checkbox" ${component.content.checked ? 'checked' : ''} />`; break;
    case 'Radio': elementHtml = `<input ${allAttrs} type="radio" ${component.content.checked ? 'checked' : ''} />`; break;
    case 'Select': elementHtml = `<select ${allAttrs}>${(component.content.selectOptions || '').split(',').map(opt => `<option>${opt.trim()}</option>`).join('')}</select>`; break;
    case 'Map': elementHtml = `<iframe ${allAttrs} loading="lazy" allowfullscreen src="https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=${encodeURIComponent(component.content.mapQuery || '')}"></iframe>`; break;
    case 'SocialIcons': elementHtml = `<div ${allAttrs}>${(component.content.socialLinks || []).map(link => `<a href="${encodeURI(link.url)}">${ICON_LIBRARY[link.network] ? `<svg viewBox="${ICON_LIBRARY[link.network].viewBox}" fill="currentColor" width="24" height="24"><path d="${ICON_LIBRARY[link.network].path}" /></svg>`: ''}</a>`).join('')}</div>`; break;
    case 'Table': const rows = (component.content.tableData || '').split('\n').map(row => row.split(',')); elementHtml = `<table ${allAttrs}>${rows.map((row, i) => `<tr>${row.map((cell, j) => i === 0 ? `<th>${cell}</th>` : `<td>${cell}</td>`).join('')}</tr>`).join('')}</table>`; break;
    case 'List': const ListEl = component.content.listType === 'ordered' ? 'ol' : 'ul'; elementHtml = `<${ListEl} ${allAttrs}>${(component.content.listItems || '').split('\n').map(item => `<li>${item}</li>`).join('')}</${ListEl}>`; break;
    case 'Blockquote': elementHtml = `<blockquote ${allAttrs}><p>${component.content.quote || ''}</p><footer>- ${component.content.cite || ''}</footer></blockquote>`; break;
    case 'Spinner': elementHtml = `<div ${allAttrs}></div>`; break;
    case 'Rating': elementHtml = `<div ${allAttrs}>${[...Array(component.content.maxRating || 5)].map((_, i) => `<span class="${i < (component.content.rating || 0) ? 'filled' : ''}">★</span>`).join('')}</div>`; break;
    case 'Carousel': elementHtml = `<div ${allAttrs} class="carousel-container"><div class="carousel-track">${(component.content.carouselImages || []).map(img => `<div class="carousel-slide"><img src="${encodeURI(img.src)}" alt="${img.alt}" /></div>`).join('')}</div><button class="carousel-prev">‹</button><button class="carousel-next">›</button></div>`; break;
    default: elementHtml = `<!-- Unknown: ${(component as any).type} -->`;
  }
  
  if (component.linkUrl) {
    let href = component.linkUrl;
    if (isProjectExport && href.startsWith('page:')) {
        const pageId = href.replace('page:', '');
        const linkedPage = pages.find(p => p.id === pageId);
        if(linkedPage) href = getPageFileName(linkedPage, pages[0].id === pageId);
        else href = '#';
    } else if (!isProjectExport && href.startsWith('page:')) {
        href = `javascript:showPage('${href.replace('page:', '')}')`;
    } else if (!href.startsWith('page:')) {
        href = encodeURI(href);
    }
    return `<a href="${href}">${elementHtml}</a>`;
  }
  return elementHtml;
};

const generateSharedJs = (projectSettings: ProjectSettings): string => `
// Built-in component interactivity
document.addEventListener('DOMContentLoaded', function() {
  // Accordion
  document.querySelectorAll('.accordion-title').forEach(title => {
    title.addEventListener('click', () => {
      const item = title.parentElement;
      const content = title.nextElementSibling;
      item.classList.toggle('open');
      content.style.maxHeight = item.classList.contains('open') ? content.scrollHeight + 'px' : '0px';
    });
  });
  // Tabs
  document.querySelectorAll('.tabs-container').forEach(container => {
    container.addEventListener('click', e => {
      if (!e.target.matches('.tab-button')) return;
      const index = e.target.dataset.tabIndex;
      container.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      container.querySelectorAll('.tab-content').forEach(c => c.classList.toggle('active', c.dataset.tabContent === index));
    });
  });
  // Carousel
  document.querySelectorAll('.carousel-container').forEach(container => {
    const track = container.querySelector('.carousel-track');
    if (!track) return;
    const slides = Array.from(track.children);
    if (slides.length === 0) return;
    let currentIndex = 0;
    const slideWidth = slides[0].getBoundingClientRect().width;
    
    const goToSlide = (index) => {
      track.style.transform = 'translateX(-' + slideWidth * index + 'px)';
      currentIndex = index;
    };

    const nextBtn = container.querySelector('.carousel-next');
    const prevBtn = container.querySelector('.carousel-prev');

    if(nextBtn) nextBtn.addEventListener('click', () => {
      goToSlide((currentIndex + 1) % slides.length);
    });
    if(prevBtn) prevBtn.addEventListener('click', () => {
      goToSlide((currentIndex - 1 + slides.length) % slides.length);
    });
  });
});

// Global Custom JavaScript
${projectSettings.globalJs || ''}
`;

export const generateProjectFiles = (pages: Page[], pageLayouts: Record<string, PageComponent[]>, theme: ThemeStyles, projectSettings: ProjectSettings): Record<string, string> => {
    const files: Record<string, string> = {};
    const bodyBgCss = theme.bodyBackground.startsWith('#') ? theme.bodyBackground : tailwindToCssMap.backgroundColor[theme.bodyBackground] || '#ffffff';
    const bodyColorCss = theme.bodyColor.startsWith('#') ? theme.bodyColor : tailwindToCssMap.textColor[theme.bodyColor] || '#000000';
    let allCss = `:root { --font-family: ${theme.fontFamily}; --background-color: ${bodyBgCss}; --text-color: ${bodyColorCss}; } body { margin: 0; font-family: var(--font-family); background-color: #1f2937; } * { box-sizing: border-box; } img, iframe { max-width: 100%; height: auto; display: block; border: none; } a { color: inherit; text-decoration: none; } input, textarea, button, select { font-family: inherit; } .main-nav { background-color: rgba(0,0,0,0.2); padding: 1rem; } .main-nav ul { list-style: none; margin: 0; padding: 0; display: flex; gap: 1.5rem; justify-content: center; } .main-nav a { color: #ffffff; padding-bottom: 0.25rem; border-bottom: 2px solid transparent; transition: border-color 0.3s; } .main-nav a:hover, .main-nav a.active { border-color: #ffffff; } main { padding: 2rem 1rem; } #page-frame { position: relative; width: 100%; max-width: 1280px; height: 720px; margin: 0 auto; box-shadow: 0 10px 25px rgba(0,0,0,0.3); overflow: hidden; background-color: var(--background-color); color: var(--text-color); } .dropdown-container { display: inline-block; } .dropdown-button { width: 100%; height: 100%; border: none; background: inherit; color: inherit; font: inherit; cursor: pointer; text-align: center; } .dropdown-content { display: none; position: absolute; background-color: #f9f9f9; min-width: 160px; box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2); z-index: 1; list-style: none; padding: 0; margin-top: 5px; border-radius: 4px; overflow: hidden; } .dropdown-content a { color: black; padding: 12px 16px; text-decoration: none; display: block; } .dropdown-content a:hover { background-color: #f1f1f1; } .dropdown-container:hover .dropdown-content { display: block; } .accordion-item { border-bottom: 1px solid #4b5563; } .accordion-title { display: flex; justify-content: space-between; align-items: center; width: 100%; padding: 1rem; background: none; border: none; color: inherit; font-size: 1rem; text-align: left; cursor: pointer; } .accordion-content { max-height: 0; overflow: hidden; transition: max-height 0.3s ease-out; padding: 0 1rem; } .accordion-content p { padding-bottom: 1rem; } .accordion-icon { font-size: 1.25rem; } .tabs-nav { display: flex; border-bottom: 1px solid #4b5563; } .tab-button { padding: 0.75rem 1.25rem; background: none; border: none; color: #9ca3af; cursor: pointer; font-size: 1rem; } .tab-button.active { color: #ffffff; border-bottom: 2px solid #3b82f6; } .tabs-content-wrapper { position: relative; width: 100%; flex-grow: 1; } .tab-content { display: none; position: absolute; top:0; left:0; width: 100%; height: 100%; } .tab-content.active { display: block; } .tabs-container { display: flex; flex-direction: column; height: 100%; } .carousel-container { position: relative; overflow: hidden; } .carousel-track { display: flex; transition: transform 0.5s ease-in-out; } .carousel-slide { min-width: 100%; } .carousel-prev, .carousel-next { position: absolute; top: 50%; transform: translateY(-50%); background-color: rgba(0,0,0,0.5); color: white; border: none; padding: 0.5rem 1rem; cursor: pointer; z-index: 1; } .carousel-prev { left: 1rem; } .carousel-next { right: 1rem; }`;
    pages.forEach(page => { allCss += generateCssForLayout(pageLayouts[page.id] || []); });
    files['styles.css'] = allCss;
    files['script.js'] = generateSharedJs(projectSettings);
    const navLinksHtml = pages.map((page, index) => `<li><a href="./${getPageFileName(page, index === 0)}" class="nav-link" data-page-name="${getPageFileName(page, index === 0)}">${page.name}</a></li>`).join('\n');
    pages.forEach((page, index) => {
        const fileName = getPageFileName(page, index === 0);
        const headContent = `${projectSettings.globalHeadContent || ''}\n${page.customHeadContent || ''}`;
        const pageScript = page.customJs ? `<script>${page.customJs}</script>` : '';
        files[fileName] = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${page.seoTitle||page.name}</title><meta name="description" content="${page.seoDescription||''}"><link rel="stylesheet" href="styles.css">${headContent}</head><body><header><nav class="main-nav"><ul>${navLinksHtml.replace(`data-page-name="${fileName}"`,`data-page-name="${fileName}" class="active"`)}</ul></nav></header><main><div id="page-frame">${(pageLayouts[page.id]||[]).map(c=>generateHtmlForComponent(c,pages,true)).join('\n')}</div></main><script src="script.js"></script>${pageScript}</body></html>`;
    });
    return files;
};

export const generateSelfContainedPageHtml = (pages: Page[], pageLayouts: Record<string, PageComponent[]>, theme: ThemeStyles, viewport: Viewport, pageId: string, projectSettings: ProjectSettings): string => {
    const pageToExport = pages.find(p => p.id === pageId);
    if (!pageToExport) return "Page not found.";
    const cssContent = generateCssForLayout(pageLayouts[pageId] || []);
    const htmlContent = (pageLayouts[pageId] || []).map(c => generateHtmlForComponent(c, pages, false)).join('\n');
    const jsContent = generateSharedJs(projectSettings);
    const bodyBgCss = theme.bodyBackground.startsWith('#') ? theme.bodyBackground : tailwindToCssMap.backgroundColor[theme.bodyBackground] || '#ffffff';
    const bodyColorCss = theme.bodyColor.startsWith('#') ? theme.bodyColor : tailwindToCssMap.textColor[theme.bodyColor] || '#000000';
    const navLinks = pages.map(page => `<li><a href="javascript:alert('This is a single page export. Navigation to other pages is not included.')">${page.name}</a></li>`).join('\n');
    const headContent = `${projectSettings.globalHeadContent || ''}\n${pageToExport.customHeadContent || ''}`;
    const allJs = `${jsContent}\n// Page Specific JS\n${pageToExport.customJs || ''}`;
    return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${pageToExport.seoTitle||pageToExport.name}</title><meta name="description" content="${pageToExport.seoDescription||''}">${headContent}<style>:root { --font-family: ${theme.fontFamily}; --background-color: ${bodyBgCss}; --text-color: ${bodyColorCss}; } body { margin: 0; font-family: var(--font-family); background-color: #1f2937; } * { box-sizing: border-box; } img, iframe { max-width: 100%; height: auto; display: block; border: none; } a { color: inherit; text-decoration: none; } input, textarea, button, select { font-family: inherit; } .main-nav { background-color: rgba(0,0,0,0.2); padding: 1rem; } .main-nav ul { list-style: none; margin: 0; padding: 0; display: flex; gap: 1.5rem; justify-content: center; } .main-nav a { color: #ffffff; } main { padding: 2rem 1rem; } #page-frame { position: relative; width: 100%; max-width: ${viewport.width}px; height: ${viewport.height}px; margin: 0 auto; box-shadow: 0 10px 25px rgba(0,0,0,0.3); overflow: hidden; background-color: var(--background-color); color: var(--text-color); } .dropdown-container { display: inline-block; } .dropdown-button { width: 100%; height: 100%; border: none; background: inherit; color: inherit; font: inherit; cursor: pointer; text-align: center; } .dropdown-content { display: none; position: absolute; background-color: #f9f9f9; min-width: 160px; box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2); z-index: 1; list-style: none; padding: 0; margin-top: 5px; border-radius: 4px; overflow: hidden; } .dropdown-content a { color: black; padding: 12px 16px; text-decoration: none; display: block; } .dropdown-content a:hover { background-color: #f1f1f1; } .dropdown-container:hover .dropdown-content { display: block; } .accordion-item { border-bottom: 1px solid #4b5563; } .accordion-title { display: flex; justify-content: space-between; align-items: center; width: 100%; padding: 1rem; background: none; border: none; color: inherit; font-size: 1rem; text-align: left; cursor: pointer; } .accordion-content { max-height: 0; overflow: hidden; transition: max-height 0.3s ease-out; padding: 0 1rem; } .accordion-content p { padding-bottom: 1rem; } .accordion-icon { font-size: 1.25rem; } .tabs-nav { display: flex; border-bottom: 1px solid #4b5563; } .tab-button { padding: 0.75rem 1.25rem; background: none; border: none; color: #9ca3af; cursor: pointer; font-size: 1rem; } .tab-button.active { color: #ffffff; border-bottom: 2px solid #3b82f6; } .tabs-content-wrapper { position: relative; width: 100%; flex-grow: 1; } .tab-content { display: none; position: absolute; top:0; left:0; width: 100%; height: 100%; } .tab-content.active { display: block; } .tabs-container { display: flex; flex-direction: column; height: 100%; } .carousel-container { position: relative; overflow: hidden; } .carousel-track { display: flex; transition: transform 0.5s ease-in-out; } .carousel-slide { min-width: 100%; } .carousel-prev, .carousel-next { position: absolute; top: 50%; transform: translateY(-50%); background-color: rgba(0,0,0,0.5); color: white; border: none; padding: 0.5rem 1rem; cursor: pointer; z-index: 1; } .carousel-prev { left: 1rem; } .carousel-next { right: 1rem; } ${cssContent}</style></head><body><header><nav class="main-nav"><ul>${navLinks}</ul></nav></header><main><div id="page-frame">${htmlContent}</div></main><script>${allJs}</script></body></html>`;
};