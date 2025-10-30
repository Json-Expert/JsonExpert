import { X } from 'lucide-react';
import React from 'react';
import { createPortal } from 'react-dom';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

interface PropertyDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyKey: string;
  propertyValue: any;
  propertyType: string;
}

export const PropertyDetailModal: React.FC<PropertyDetailModalProps> = ({
  isOpen,
  onClose,
  propertyKey,
  propertyValue,
  propertyType,
}) => {
  if (!isOpen) return null;

  const formatValue = () => {
    if (propertyValue === null) return 'null';
    if (propertyValue === undefined) return 'undefined';

    try {
      if (propertyType === 'object' || propertyType === 'array') {
        return JSON.stringify(propertyValue, null, 2);
      }
      if (propertyType === 'string') {
        return propertyValue;
      }
      return String(propertyValue);
    } catch (e) {
      return String(propertyValue);
    }
  };

  const renderTreeView = (obj: any, depth = 0): React.ReactNode => {
    if (obj === null) return <span className="text-gray-500">null</span>;
    if (obj === undefined) return <span className="text-gray-500">undefined</span>;

    if (Array.isArray(obj)) {
      return (
        <div className="ml-4 border-l-2 border-gray-300 dark:border-gray-700 pl-2">
          {obj.map((item, index) => (
            <div key={index} className="py-1">
              <span className="text-purple-600 dark:text-purple-400 font-mono text-sm">[{index}]</span>
              <span className="mx-2">:</span>
              {typeof item === 'object' && item !== null ? (
                renderTreeView(item, depth + 1)
              ) : (
                <span className={getValueColor(item)}>{formatSimpleValue(item)}</span>
              )}
            </div>
          ))}
        </div>
      );
    }

    if (typeof obj === 'object') {
      return (
        <div className="ml-4 border-l-2 border-gray-300 dark:border-gray-700 pl-2">
          {Object.entries(obj).map(([key, val]) => (
            <div key={key} className="py-1">
              <span className="text-orange-600 dark:text-orange-400 font-mono text-sm">"{key}"</span>
              <span className="mx-2">:</span>
              {typeof val === 'object' && val !== null ? (
                renderTreeView(val, depth + 1)
              ) : (
                <span className={getValueColor(val)}>{formatSimpleValue(val)}</span>
              )}
            </div>
          ))}
        </div>
      );
    }

    return <span className={getValueColor(obj)}>{formatSimpleValue(obj)}</span>;
  };

  const getValueColor = (val: any) => {
    if (val === null) return 'text-gray-500';
    if (typeof val === 'string') return 'text-green-600 dark:text-green-400';
    if (typeof val === 'number') return 'text-blue-600 dark:text-blue-400';
    if (typeof val === 'boolean') return 'text-pink-600 dark:text-pink-400';
    return 'text-gray-700 dark:text-gray-300';
  };

  const formatSimpleValue = (val: any) => {
    if (val === null) return 'null';
    if (val === undefined) return 'undefined';
    if (typeof val === 'string') return `"${val}"`;
    return String(val);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[10001] flex items-center justify-center p-4"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(8px)',
      }}
      onClick={onClose}
    >
      <Card
        className="w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0 flex-shrink-0">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-lg">Property Details</CardTitle>
            <p className="text-sm text-muted-foreground mt-1 font-mono truncate">
              {propertyKey}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden flex flex-col">
          <div className="mb-3 flex items-center gap-2 flex-shrink-0">
            <span className="text-xs font-medium text-muted-foreground">Type:</span>
            <span className={`text-xs font-medium px-2 py-1 rounded ${
              propertyType === 'string' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
              propertyType === 'number' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
              propertyType === 'object' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' :
              propertyType === 'array' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' :
              'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
            }`}>
              {propertyType}
            </span>
          </div>

          <div className="flex-1 overflow-auto rounded-md border bg-gray-50 dark:bg-gray-950 p-4">
            {propertyType === 'object' || propertyType === 'array' ? (
              <div className="font-mono text-sm">
                {renderTreeView(propertyValue)}
              </div>
            ) : (
              <pre className="font-mono text-sm whitespace-pre-wrap break-words">
                {formatValue()}
              </pre>
            )}
          </div>
        </CardContent>
      </Card>
    </div>,
    document.body
  );
};
