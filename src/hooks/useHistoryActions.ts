import { useHistoryStore } from '../stores/history-store';
import { useJsonStore } from '../stores/json-store';

export const useHistoryActions = () => {
  const { 
    entries, 
    currentIndex, 
    goToEntry, 
    undo, 
    redo, 
    clearHistory, 
    removeEntry,
    canUndo,
    canRedo 
  } = useHistoryStore();
  
  const { setJsonData, setInputMethod } = useJsonStore();

  const handleGoToEntry = (index: number): void => {
    const entry = goToEntry(index);
    if (entry) {
      setJsonData(entry.data, entry.rawInput);
      setInputMethod(entry.inputMethod);
    }
  };

  const handleUndo = (): void => {
    const entry = undo();
    if (entry) {
      setJsonData(entry.data, entry.rawInput);
      setInputMethod(entry.inputMethod);
    }
  };

  const handleRedo = (): void => {
    const entry = redo();
    if (entry) {
      setJsonData(entry.data, entry.rawInput);
      setInputMethod(entry.inputMethod);
    }
  };

  const handleRemoveEntry = (index: number): void => {
    const entry = entries[index]; // eslint-disable-line security/detect-object-injection
    if (entry) {
      removeEntry(entry.id);
    }
  };

  const handleClearHistory = (): void => {
    clearHistory();
  };

  return {
    entries,
    currentIndex,
    canUndo,
    canRedo,
    handleGoToEntry,
    handleUndo,
    handleRedo,
    handleRemoveEntry,
    handleClearHistory,
  };
};