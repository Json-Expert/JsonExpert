import { X, ExternalLink, Copy, Download } from 'lucide-react';
import React from 'react';

import { cn } from '../../../lib/utils';

interface ContentPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  content: any;
  nodeId: string;
  title: string;
}

export const ContentPreview: React.FC<ContentPreviewProps> = ({
  isOpen,
  onClose,
  content,
  nodeId,
  title
}) => {
  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(typeof content === 'string' ? content : JSON.stringify(content, null, 2));
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const handleDownload = () => {
    const text = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${nodeId}-content.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const isImageUrl = (url: string): boolean => {
    const imageExtensions = /\.(jpg|jpeg|png|gif|bmp|svg|webp)$/i;
    const dataUrl = /^data:image\//i;
    return imageExtensions.test(url) || dataUrl.test(url);
  };

  const isUrl = (text: string): boolean => {
    try {
      new URL(text);
      return text.startsWith('http://') || text.startsWith('https://');
    } catch {
      return false;
    }
  };

  const renderContent = () => {
    if (typeof content === 'string') {
      if (isImageUrl(content)) {
        return (
          <div className="flex flex-col items-center space-y-4">
            <img
              src={content}
              alt="Preview"
              className="max-w-full max-h-96 object-contain rounded-lg shadow-lg"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                const errorDiv = document.createElement('div');
                errorDiv.className = 'text-red-500 text-center p-4';
                errorDiv.textContent = 'Image could not be loaded';
                (e.target as HTMLElement).parentNode?.appendChild(errorDiv);
              }}
            />
            <div className="text-sm text-gray-600 dark:text-gray-400 break-all max-w-full">
              {content}
            </div>
          </div>
        );
      }

      if (isUrl(content)) {
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <ExternalLink className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <a
                href={content}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline break-all"
              >
                {content}
              </a>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Click the link to open in a new tab
            </div>
          </div>
        );
      }

      // Large text
      return (
        <div className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 font-mono text-sm max-h-96 overflow-auto">
            <pre className="whitespace-pre-wrap break-words">{content}</pre>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {content.length} characters
          </div>
        </div>
      );
    }

    // JSON content
    return (
      <div className="space-y-4">
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 font-mono text-sm max-h-96 overflow-auto">
          <pre className="whitespace-pre-wrap break-words">
            {JSON.stringify(content, null, 2)}
          </pre>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Displayed in JSON format
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={cn(
        'relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl',
        'max-w-4xl max-h-[90vh] w-full mx-4 flex flex-col'
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Content Preview
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {title}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
              title="Copy"
            >
              <Copy className="h-4 w-4" />
            </button>
            
            <button
              onClick={handleDownload}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
              title="Download"
            >
              <Download className="h-4 w-4" />
            </button>
            
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};