import { useState, useCallback } from 'react';

import { createError, ErrorCodes } from '@/lib/error-handler';
import { stringifyJSON } from '@/lib/json-parser';
import { validateFile } from '@/lib/validation';
import { useJsonStore } from '@/stores/json-store';
import { FileUploadResult } from '@/types/api.types';

import { useErrorHandler } from './useErrorHandler';
import { useLargeFileHandler } from './useLargeFileHandler';

export const useFileUpload = () => {
  const [isDragging, setIsDragging] = useState(false);
  const { setJsonData, setInputMethod, setLoading, setError, addToHistory } = useJsonStore();
  const { handleError, showSuccess, showToast } = useErrorHandler();
  const { processFileWithWorker, progress: workerProgress, isProcessing } = useLargeFileHandler();

  const processFile = useCallback(async (file: File): Promise<FileUploadResult> => {
    const validation = validateFile(file);
    if (!validation.isValid) {
      const error = validation.error || 'File validation failed';

      // Determine appropriate error code based on validation error
      let errorCode: keyof typeof ErrorCodes = 'FILE_INVALID_FORMAT';
      if (error.includes('size') || error.includes('large')) {
        errorCode = 'FILE_TOO_LARGE';
      }

      const fileError = createError(errorCode, error);
      handleError(fileError, { context: 'FileUpload' });
      return { success: false, error };
    }

    try {
      setLoading(true);
      const data = await processFileWithWorker(file);
      const jsonString = stringifyJSON(data);

      setJsonData(data, jsonString);
      setInputMethod('file');
      addToHistory('file', jsonString);

      showSuccess('File uploaded successfully', `Loaded ${file.name}`);

      return { success: true, data, fileName: file.name, fileSize: file.size };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process file';
      handleError(error, {
        context: 'FileUpload',
        toastTitle: 'Failed to process file',
      });
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [processFileWithWorker, setLoading, setJsonData, setInputMethod, addToHistory, handleError, showSuccess, setError]);

  const handleFileUpload = useCallback(async (file: File) => {
    setError(null);
    return await processFile(file);
  }, [processFile, setError]);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const jsonFiles = files.filter(file => {
      const ext = file.name.toLowerCase().split('.').pop() || '';
      return ['json', 'geojson', 'txt'].includes(ext) || file.type === 'application/json' || file.type === 'text/plain';
    });

    if (jsonFiles.length === 0) {
      const error = createError(
        ErrorCodes.FILE_INVALID_FORMAT,
        'Please drop a valid JSON file (.json, .geojson, or .txt)'
      );
      handleError(error, { context: 'FileUpload' });
      return;
    }

    if (jsonFiles.length > 1) {
      showToast({
        title: 'Multiple files detected',
        description: `Processing the first file: ${jsonFiles[0]?.name || 'unknown'}`,
        variant: 'info',
      });
    }

    const firstFile = jsonFiles[0];
    if (firstFile) {
      await handleFileUpload(firstFile);
    }
  }, [handleFileUpload, handleError, showToast]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  return {
    isDragging,
    uploadProgress: workerProgress,
    isProcessing,
    handleFileUpload,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
};