import Editor from '@monaco-editor/react';
import { FileJson, AlertCircle } from 'lucide-react';
import React, { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardFooter } from '@/components/ui/Card';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { MONACO_EDITOR_OPTIONS } from '@/lib/constants';
import { createError, ErrorCodes } from '@/lib/error-handler';
import { cleanControlCharacters, brutalSanitize } from '@/lib/file-processor';
import { parseJSON, validateJSON } from '@/lib/json-parser';
import { useJsonStore } from '@/stores/json-store';
import { useUIStore } from '@/stores/ui-store';


export const TextPaste: React.FC = () => {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { setJsonData, setInputMethod, addToHistory } = useJsonStore();
  const { theme } = useUIStore();
  const { handleError, showSuccess } = useErrorHandler();

  const handleChange = (newValue: string | undefined) => {
    setValue(newValue || '');
    if (newValue) {
      // Clean control characters before validation
      const cleanedValue = cleanControlCharacters(newValue);
      const validation = validateJSON(cleanedValue);
      setError(validation.isValid ? null : validation.error || 'Invalid JSON');
    } else {
      setError(null);
    }
  };

  const handleParse = () => {
    if (!value.trim()) {
      const emptyError = createError(
        ErrorCodes.JSON_INVALID_STRUCTURE,
        'Please enter some JSON'
      );
      handleError(emptyError, {
        context: 'TextPaste',
        toastTitle: 'No Input',
      });
      setError('Please enter some JSON');
      return;
    }

    // BRUTAL SANITIZE FIRST, THEN CLEAN
    let cleanedValue = brutalSanitize(value);
    cleanedValue = cleanControlCharacters(cleanedValue);

    const result = parseJSON(cleanedValue);
    if (result.isValid && result.data !== null) {
      setJsonData(result.data, cleanedValue);
      setInputMethod('paste');
      addToHistory('paste', cleanedValue);
      showSuccess('JSON parsed successfully');
      setValue('');
      setError(null);
    } else {
      const parseError = createError(
        ErrorCodes.JSON_PARSE_ERROR,
        result.error || 'Invalid JSON'
      );
      handleError(parseError, { context: 'TextPaste' });
      setError(result.error || 'Invalid JSON');
    }
  };

  const handleFormat = () => {
    try {
      // Clean control characters before formatting
      const cleanedValue = cleanControlCharacters(value);
      const parsed = JSON.parse(cleanedValue);
      setValue(JSON.stringify(parsed, null, 2));
      setError(null);
    } catch (_e) {
      const formatError = createError(
        ErrorCodes.JSON_PARSE_ERROR,
        'Cannot format invalid JSON'
      );
      handleError(formatError, {
        context: 'TextPaste',
        toastTitle: 'Format Failed',
      });
      setError('Cannot format invalid JSON');
    }
  };

  return (
    <Card>
      <CardContent className="p-0">
        <div className="h-[400px] w-full">
          <Editor
            value={value}
            onChange={handleChange}
            language="json"
            theme={theme === 'dark' ? 'vs-dark' : 'light'}
            options={{
              ...MONACO_EDITOR_OPTIONS,
            }}
          />
        </div>
      </CardContent>
      
      <CardFooter className="justify-between border-t p-4">
        <div className="flex items-center space-x-2">
          {error && (
            <div className="flex items-center text-sm text-destructive">
              <AlertCircle className="mr-1 h-4 w-4" />
              {error}
            </div>
          )}
        </div>
        
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={handleFormat}
            disabled={!value.trim()}
          >
            Format
          </Button>
          <Button
            onClick={handleParse}
            disabled={!value.trim() || !!error}
          >
            <FileJson className="mr-2 h-4 w-4" />
            Parse JSON
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};