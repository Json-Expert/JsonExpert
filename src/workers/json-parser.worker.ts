/// <reference lib="webworker" />

import { parseJSON } from '@/lib/json-parser';

self.addEventListener('message', (event: MessageEvent<string>) => {
  const { data: jsonString } = event;

  try {
    const result = parseJSON(jsonString);
    if (result.isValid) {
      self.postMessage({ success: true, data: result.data });
    } else {
      self.postMessage({ success: false, error: result.error });
    }
  } catch (error) {
    self.postMessage({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown worker error' 
    });
  }
});
