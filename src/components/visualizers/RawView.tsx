import Editor from '@monaco-editor/react';
import { useMemo } from 'react';

import { MONACO_EDITOR_OPTIONS } from '../../lib/constants';
import { stringifyJSON } from '../../lib/json-parser';
import { useUIStore } from '../../stores/ui-store';
import { JsonValue } from '../../types/json.types';

interface RawViewProps {
  data: JsonValue;
}

export const RawView: React.FC<RawViewProps> = ({ data }) => {
  const { theme, showLineNumbers, wordWrap } = useUIStore();
  
  const jsonString = useMemo(() => {
    return stringifyJSON(data, 2);
  }, [data]);

  return (
    <div className="h-full w-full">
      <Editor
        value={jsonString}
        language="json"
        theme={theme === 'dark' ? 'vs-dark' : 'light'}
        options={{
          ...MONACO_EDITOR_OPTIONS,
          readOnly: true,
          lineNumbers: showLineNumbers ? 'on' : 'off',
          wordWrap: wordWrap ? 'on' : 'off',
        }}
      />
    </div>
  );
};