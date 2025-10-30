import { useState, useCallback } from 'react';

export function useLargeFileHandler() {
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const processFileWithWorker = useCallback(async (file: File): Promise<any> => {
    return new Promise((resolve, reject) => {
      setIsProcessing(true);
      setProgress(0);

      // Create a worker to handle parsing
      const worker = new Worker(new URL('../workers/json-parser.worker.ts', import.meta.url), {
        type: 'module',
      });

      worker.onmessage = (event) => {
        const { success, data, error } = event.data;
        if (success) {
          resolve(data);
        } else {
          reject(new Error(error || 'Failed to parse JSON in worker'));
        }
        worker.terminate();
        setIsProcessing(false);
        setProgress(100);
      };

      worker.onerror = (error) => {
        reject(new Error(`Worker error: ${error.message}`));
        worker.terminate();
        setIsProcessing(false);
      };

      // Read the file and send it to the worker
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          const content = e.target.result as string;
          worker.postMessage(content);
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onprogress = (e) => {
        if (e.lengthComputable) {
          const percentage = (e.loaded / e.total) * 100;
          setProgress(percentage);
        }
      };
      reader.onerror = () => {
        reject(new Error('FileReader error'));
      };

      reader.readAsText(file);
    });
  }, []);

  return {
    processFileWithWorker,
    progress,
    isProcessing,
  };
}
