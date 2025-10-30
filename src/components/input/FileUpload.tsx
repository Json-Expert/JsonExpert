import { Upload, FileJson, AlertCircle, CheckCircle } from 'lucide-react';
import React, { useRef } from 'react';

import { useFileUpload } from '../../hooks/useFileUpload';
import { MAX_FILE_SIZE } from '../../lib/constants';
import { cn , formatBytes } from '../../lib/utils';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';

export const FileUpload: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadStatus, setUploadStatus] = React.useState<'idle' | 'success' | 'error'>('idle');
  const {
    isDragging,
    uploadProgress,
    handleFileUpload,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  } = useFileUpload();

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      setUploadStatus('idle');

      try {
        const result = await handleFileUpload(file);
        setUploadStatus(result.success ? 'success' : 'error');

        // Reset status after 3 seconds
        if (result.success) {
          setTimeout(() => setUploadStatus('idle'), 3000);
        }
      } catch (error) {
        console.error('File upload error:', error);
        setUploadStatus('error');
      }
    }
    
    // Reset file input to allow re-uploading the same file
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card
      className={cn(
        'relative overflow-hidden transition-all',
        isDragging && 'ring-2 ring-primary ring-offset-2'
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <CardContent className="p-8">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="rounded-full bg-primary/10 p-4">
            <FileJson className="h-8 w-8 text-primary" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Drop your JSON file here</h3>
            <p className="text-sm text-muted-foreground">
              or click to browse
            </p>
          </div>
          
          <Button
            onClick={handleClick}
            className="relative"
            variant="outline"
          >
            <Upload className="mr-2 h-4 w-4" />
            Choose File
          </Button>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.geojson,.txt,.jsonl,.ndjson,application/json,text/plain,application/geo+json"
            onChange={handleFileChange}
            className="hidden"
            multiple={false}
          />
          
          <p className="text-xs text-muted-foreground">
            Maximum file size: {formatBytes(MAX_FILE_SIZE)}
          </p>
          
          <p className="text-xs text-muted-foreground">
            Supported formats: JSON, GeoJSON, JSONL, NDJSON, TXT
          </p>
          
          {uploadStatus === 'success' && (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">File uploaded successfully!</span>
            </div>
          )}
          
          {uploadStatus === 'error' && (
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">Upload failed. Check the file format.</span>
            </div>
          )}
        </div>
        
        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="mt-4 w-full">
            <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300 ease-out"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-xs text-center mt-1 text-muted-foreground">
              {uploadProgress < 30 ? 'Reading file...' :
               uploadProgress < 60 ? 'Parsing JSON...' :
               uploadProgress < 90 ? 'Validating structure...' :
               'Almost done...'} {uploadProgress.toFixed(0)}%
            </p>
          </div>
        )}
        
        {isDragging && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="text-center">
              <Upload className="mx-auto h-12 w-12 text-primary animate-bounce" />
              <p className="mt-2 text-sm font-medium">Drop to upload</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};