import type { PageComponent } from '../types';

export const findComponent = (
  components: PageComponent[],
  id: string,
): { component: PageComponent | null; parent: PageComponent[] | null; index: number, parentComponent: PageComponent | null } => {
  for (let i = 0; i < components.length; i++) {
    const component = components[i];
    if (component.id === id) {
      return { component, parent: components, index: i, parentComponent: null };
    }
    if (component.children && component.children.length > 0) {
      const found = findComponentIn(component.children, id, component);
      if (found.component) {
        return found;
      }
    }
  }
  return { component: null, parent: null, index: -1, parentComponent: null };
};

const findComponentIn = (
    components: PageComponent[],
    id: string,
    parent: PageComponent
): { component: PageComponent | null; parent: PageComponent[] | null; index: number, parentComponent: PageComponent | null } => {
    for (let i = 0; i < components.length; i++) {
        const component = components[i];
        if (component.id === id) {
            return { component, parent: components, index: i, parentComponent: parent };
        }
        if (component.children && component.children.length > 0) {
            const found = findComponentIn(component.children, id, component);
            if (found.component) {
                return found;
            }
        }
    }
    return { component: null, parent: null, index: -1, parentComponent: null };
}

export const updateComponent = (
  components: PageComponent[],
  id: string,
  newProps: Partial<PageComponent>
): PageComponent[] => {
  return components.map(comp => {
    if (comp.id === id) {
      // Deep merge for stylesByViewport
      if (newProps.stylesByViewport) {
        return {
          ...comp,
          ...newProps,
          stylesByViewport: {
            ...comp.stylesByViewport,
            ...newProps.stylesByViewport,
          },
        };
      }
      return { ...comp, ...newProps };
    }
    if (comp.children && comp.children.length > 0) {
      return { ...comp, children: updateComponent(comp.children, id, newProps) };
    }
    return comp;
  });
};

export const addComponent = (
  components: PageComponent[],
  parentId: string | null,
  newComponent: PageComponent
): PageComponent[] => {
  if (parentId === null) {
    return [...components, newComponent];
  }

  return components.map(comp => {
    if (comp.id === parentId) {
      return { ...comp, children: [...comp.children, newComponent] };
    }
    if (comp.children && comp.children.length > 0) {
      return { ...comp, children: addComponent(comp.children, parentId, newComponent) };
    }
    return comp;
  });
};

export const addComponentAfter = (
    components: PageComponent[],
    targetId: string,
    newComponent: PageComponent
): PageComponent[] => {
    const { parent, index } = findComponent(components, targetId);

    if (parent && index !== -1) {
        const newParent = [...parent];
        newParent.splice(index + 1, 0, newComponent);

        // This is tricky. We can't just return newParent. We need to replace the parent array in the whole structure.
        // This utility needs a refactor to work immutably. For now, duplication will happen within the same parent container.
        // The logic in App.tsx will handle this.
    }

    return components; // Fallback
}


export const removeComponent = (
  components: PageComponent[],
  id: string
): { newLayout: PageComponent[]; removedComponent: PageComponent | null } => {
  let removedComponent: PageComponent | null = null;
  const newLayout = components.filter(comp => {
    if (comp.id === id) {
      removedComponent = comp;
      return false;
    }
    return true;
  }).map(comp => {
    if (comp.children && comp.children.length > 0) {
      const result = removeComponent(comp.children, id);
      if (result.removedComponent) {
        removedComponent = result.removedComponent;
      }
      return { ...comp, children: result.newLayout };
    }
    return comp;
  });
  return { newLayout, removedComponent };
};