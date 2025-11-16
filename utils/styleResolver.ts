import type { PageComponent, Viewport, ViewportStyles, ComponentStyles } from '../types';

const scalableCssProps: (keyof ComponentStyles)[] = ['top', 'left', 'width', 'height', 'fontSize'];

/**
 * Resolves the styles for a component on a given viewport.
 * If the viewport has specific styles, they are used.
 * If not, it falls back to the Desktop styles and scales them proportionally.
 */
export const getResolvedStyles = (
  component: PageComponent,
  activeViewport: Viewport,
  viewports: Viewport[]
): ViewportStyles => {
  const desktopViewport = viewports.find(v => v.name === 'Desktop')!;
  const desktopStyles = component.stylesByViewport['Desktop'] || { base: {}, hover: {} };
  const viewportStyles = component.stylesByViewport[activeViewport.name];

  if (viewportStyles) {
    // If specific styles exist, merge them over desktop for a complete set
    return {
        base: { ...desktopStyles.base, ...viewportStyles.base },
        hover: { ...desktopStyles.hover, ...viewportStyles.hover },
    };
  }
  
  if (activeViewport.name === 'Desktop') {
    return desktopStyles;
  }

  // If no specific styles, calculate scaled styles from desktop
  const scaleFactor = activeViewport.width / desktopViewport.width;
  const scaledBase: Partial<ComponentStyles> = {};
  
  for(const key in desktopStyles.base) {
    const prop = key as keyof ComponentStyles;
    const value = desktopStyles.base[prop];
    if(value && scalableCssProps.includes(prop)) {
        const numericValue = parseFloat(value);
        if(!isNaN(numericValue)) {
            scaledBase[prop] = `${numericValue * scaleFactor}px`;
        }
    }
  }

  return {
    base: { ...desktopStyles.base, ...scaledBase },
    hover: { ...desktopStyles.hover }, // Hover styles are not scaled for now
  };
};