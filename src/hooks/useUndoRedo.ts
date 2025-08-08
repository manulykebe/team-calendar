import { useState, useCallback, useRef } from 'react';

export interface UndoRedoAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  description: string;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  timestamp: number;
}

interface UseUndoRedoOptions {
  maxHistorySize?: number;
}

export function useUndoRedo(options: UseUndoRedoOptions = {}) {
  const { maxHistorySize = 50 } = options;
  
  const [undoStack, setUndoStack] = useState<UndoRedoAction[]>([]);
  const [redoStack, setRedoStack] = useState<UndoRedoAction[]>([]);
  const [isUndoing, setIsUndoing] = useState(false);
  const [isRedoing, setIsRedoing] = useState(false);
  
  // Use ref to track if we're in the middle of an undo/redo operation
  const isOperatingRef = useRef(false);

  const addAction = useCallback((action: UndoRedoAction) => {
    // Don't add actions if we're in the middle of undo/redo
    if (isOperatingRef.current) return;

    setUndoStack(prev => {
      const newStack = [...prev, action];
      // Limit stack size
      if (newStack.length > maxHistorySize) {
        return newStack.slice(-maxHistorySize);
      }
      return newStack;
    });
    
    // Clear redo stack when new action is added
    setRedoStack([]);
  }, [maxHistorySize]);

  const undo = useCallback(async () => {
    if (undoStack.length === 0 || isUndoing || isRedoing) return;

    const action = undoStack[undoStack.length - 1];
    
    try {
      setIsUndoing(true);
      isOperatingRef.current = true;
      
      await action.undo();
      
      // Move action from undo to redo stack
      setUndoStack(prev => prev.slice(0, -1));
      setRedoStack(prev => [...prev, action]);
      
    } catch (error) {
      console.error('Failed to undo action:', error);
      throw error;
    } finally {
      setIsUndoing(false);
      isOperatingRef.current = false;
    }
  }, [undoStack, isUndoing, isRedoing]);

  const redo = useCallback(async () => {
    if (redoStack.length === 0 || isUndoing || isRedoing) return;

    const action = redoStack[redoStack.length - 1];
    
    try {
      setIsRedoing(true);
      isOperatingRef.current = true;
      
      await action.redo();
      
      // Move action from redo to undo stack
      setRedoStack(prev => prev.slice(0, -1));
      setUndoStack(prev => [...prev, action]);
      
    } catch (error) {
      console.error('Failed to redo action:', error);
      throw error;
    } finally {
      setIsRedoing(false);
      isOperatingRef.current = false;
    }
  }, [redoStack, isUndoing, isRedoing]);

  const clear = useCallback(() => {
    setUndoStack([]);
    setRedoStack([]);
  }, []);

  const canUndo = undoStack.length > 0 && !isUndoing && !isRedoing;
  const canRedo = redoStack.length > 0 && !isUndoing && !isRedoing;
  
  const getLastAction = () => undoStack[undoStack.length - 1];
  const getNextRedoAction = () => redoStack[redoStack.length - 1];

  return {
    addAction,
    undo,
    redo,
    clear,
    canUndo,
    canRedo,
    isUndoing,
    isRedoing,
    undoStack,
    redoStack,
    getLastAction,
    getNextRedoAction,
  };
}