// Fix: Import React to provide namespace for React.SetStateAction
import React, { useState, useCallback } from 'react';
import { StructureItem } from '../types';

export type AppState = {
  structure: StructureItem[];
  availableJobs: StructureItem[];
  isDirty: boolean;
};

export type History<T> = {
  past: T[];
  present: T;
  future: T[];
};

export const useHistoryState = (initialState: AppState) => {
  const [history, setHistory] = useState<History<AppState>>({
    past: [],
    present: initialState,
    future: [],
  });

  const setState = useCallback((action: React.SetStateAction<AppState>) => {
    setHistory(currentHistory => {
      const newPresent = typeof action === 'function' ? action(currentHistory.present) : action;

      if (JSON.stringify(newPresent) === JSON.stringify(currentHistory.present)) {
        return currentHistory;
      }
      
      return {
        past: [...currentHistory.past, currentHistory.present],
        present: newPresent,
        future: [],
      };
    });
  }, []);

  const undo = useCallback(() => {
    setHistory(currentHistory => {
      if (currentHistory.past.length === 0) return currentHistory;
      const previous = currentHistory.past[currentHistory.past.length - 1];
      const newPast = currentHistory.past.slice(0, currentHistory.past.length - 1);
      return {
        past: newPast,
        present: previous,
        future: [currentHistory.present, ...currentHistory.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory(currentHistory => {
      if (currentHistory.future.length === 0) return currentHistory;
      const next = currentHistory.future[0];
      const newFuture = currentHistory.future.slice(1);
      return {
        past: [...currentHistory.past, currentHistory.present],
        present: next,
        future: newFuture,
      };
    });
  }, []);
  
  const resetHistory = useCallback((newState: AppState) => {
      setHistory({ past: [], present: newState, future: [] });
  }, []);

  return {
    state: history.present,
    setState,
    resetHistory,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
  };
};