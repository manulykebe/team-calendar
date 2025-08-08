import { Undo2, Redo2 } from 'lucide-react';
import { useEventOperations } from '../../hooks/useEventOperations';
import { useTranslation } from '../../context/TranslationContext';
import toast from 'react-hot-toast';

interface UndoRedoControlsProps {
  className?: string;
}

export function UndoRedoControls({ className = '' }: UndoRedoControlsProps) {
  const { t } = useTranslation();
  const { 
    undo, 
    redo, 
    canUndo, 
    canRedo, 
    isUndoing, 
    isRedoing 
  } = useEventOperations();

  const handleUndo = async () => {
    try {
      await undo();
    } catch (error) {
      toast.error(t('undoRedo.undoFailed'));
    }
  };

  const handleRedo = async () => {
    try {
      await redo();
    } catch (error) {
      toast.error(t('undoRedo.redoFailed'));
    }
  };

  // Don't render if no actions are available
  if (!canUndo && !canRedo) {
    return null;
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <button
        onClick={handleUndo}
        disabled={!canUndo || isUndoing}
        className={`p-2 rounded-full transition-all duration-200 ${
          canUndo && !isUndoing
            ? 'text-blue-600 hover:bg-blue-50 hover:text-blue-700'
            : 'text-zinc-300 cursor-not-allowed'
        }`}
        title={canUndo ? t('undoRedo.undo') : t('undoRedo.nothingToUndo')}
        aria-label={t('undoRedo.undo')}
      >
        <Undo2 className={`w-5 h-5 ${isUndoing ? 'animate-spin' : ''}`} />
      </button>
      
      <button
        onClick={handleRedo}
        disabled={!canRedo || isRedoing}
        className={`p-2 rounded-full transition-all duration-200 ${
          canRedo && !isRedoing
            ? 'text-blue-600 hover:bg-blue-50 hover:text-blue-700'
            : 'text-zinc-300 cursor-not-allowed'
        }`}
        title={canRedo ? t('undoRedo.redo') : t('undoRedo.nothingToRedo')}
        aria-label={t('undoRedo.redo')}
      >
        <Redo2 className={`w-5 h-5 ${isRedoing ? 'animate-spin' : ''}`} />
      </button>
    </div>
  );
}