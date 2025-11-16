import { useState, useCallback } from 'react';

interface History<T> {
  past: T[];
  present: T;
  future: T[];
}

export const useHistory = <T>(initialState: T) => {
  const [state, setState] = useState<History<T>>({
    past: [],
    present: initialState,
    future: [],
  });

  const canUndo = state.past.length > 0;
  const canRedo = state.future.length > 0;

  const undo = useCallback(() => {
    if (!canUndo) return;
    setState(currentState => {
      const newFuture = [currentState.present, ...currentState.future];
      const newPresent = currentState.past[currentState.past.length - 1];
      const newPast = currentState.past.slice(0, currentState.past.length - 1);
      return { past: newPast, present: newPresent, future: newFuture };
    });
  }, [canUndo]);

  const redo = useCallback(() => {
    if (!canRedo) return;
    setState(currentState => {
      const newPast = [...currentState.past, currentState.present];
      const newPresent = currentState.future[0];
      const newFuture = currentState.future.slice(1);
      return { past: newPast, present: newPresent, future: newFuture };
    });
  }, [canRedo]);

  const set = useCallback((newState: T) => {
    setState(currentState => {
      // Simple stringify check to prevent adding identical states to history
      if (JSON.stringify(newState) === JSON.stringify(currentState.present)) {
        return currentState;
      }
      const newPast = [...currentState.past, currentState.present];
      return { past: newPast, present: newState, future: [] };
    });
  }, []);
  
  const resetState = useCallback((newState: T) => {
    setState({
        past: [],
        present: newState,
        future: [],
    });
  }, []);

  return {
    state: state.present,
    setState: set,
    resetState: resetState,
    undo,
    redo,
    canUndo,
    canRedo,
  };
};
