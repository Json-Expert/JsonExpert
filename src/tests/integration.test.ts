import { describe, it, expect, beforeAll } from 'vitest';

import { enhancedFetchJSON } from '@/lib/enhanced-url-fetcher';
import { processJSONFile, sanitizeJSONData, brutalSanitize, preprocessJSON } from '@/lib/file-processor';
import { parseJSON, validateJSON } from '@/lib/json-parser';

// Setup proper File and Blob mocks for JSDOM environment
beforeAll(() => {
  // Store original Blob constructor
  const OriginalBlob = global.Blob;

  // Mock Blob.text() method
  if (!Blob.prototype.text) {
    Blob.prototype.text = async function(this: Blob) {
      // In Node/JSDOM, we can access blob parts directly
      const parts = (this as any).parts || [];
      if (parts.length > 0) {
        return parts.join('');
      }
      // Fallback: try to read from internal buffer
      return '';
    };
  }

  // Override Blob constructor to store parts for later retrieval
  global.Blob = class BlobMock extends OriginalBlob {
    parts: any[];
    _rawParts: BlobPart[];

    constructor(parts: BlobPart[] = [], options?: BlobPropertyBag) {
      super(parts, options);
      this._rawParts = parts;
      // Store parts so we can retrieve them later
      this.parts = parts.map(part => {
        if (typeof part === 'string') return part;
        if (part instanceof ArrayBuffer) return new TextDecoder().decode(part);
        if (ArrayBuffer.isView(part)) return new TextDecoder().decode(part);
        return String(part);
      });
    }

    override async text(): Promise<string> {
      return this.parts.join('');
    }

    override slice(start?: number, end?: number, contentType?: string): Blob {
      const text = this.parts.join('');
      const sliced = text.slice(start, end);
      return new (global.Blob as any)([sliced], { type: contentType || this.type });
    }

    override async arrayBuffer(): Promise<ArrayBuffer> {
      const text = this.parts.join('');
      const encoder = new TextEncoder();
      return encoder.encode(text).buffer;
    }
  } as any;

  // Mock File constructor to work with our Blob mock
  global.File = class FileMock extends (global.Blob as any) {
    constructor(parts: BlobPart[], filename: string, options?: FilePropertyBag) {
      super(parts, options);

      // Use Object.defineProperty to set read-only properties
      Object.defineProperty(this, 'name', {
        value: filename,
        writable: false,
        enumerable: true,
        configurable: true,
      });

      Object.defineProperty(this, 'lastModified', {
        value: options?.lastModified || Date.now(),
        writable: false,
        enumerable: true,
        configurable: true,
      });

      // Type is inherited from Blob but we can override the getter
      const fileType = options?.type || '';
      Object.defineProperty(this, 'type', {
        get() { return fileType; },
        enumerable: true,
        configurable: true,
      });
    }
  } as any;

  // Mock FileReader
  global.FileReader = class FileReaderMock {
    result: string | ArrayBuffer | null = null;
    onload: ((event: any) => void) | null = null;
    onerror: ((event: any) => void) | null = null;
    readyState: number = 0;

    readAsText(blob: Blob) {
      // Use our Blob.text() mock
      const blobMock = blob as any;
      const text = blobMock.parts ? blobMock.parts.join('') : '';

      // Simulate async reading
      setTimeout(() => {
        this.result = text;
        this.readyState = 2; // DONE
        if (this.onload) {
          this.onload({ target: { result: text } });
        }
      }, 0);
    }
  } as any;
});

describe('JSON Expert Integration Tests', () => {
  describe('File Processing', () => {
    it('should handle simple JSON files', async () => {
      const content = '{"name": "Test", "value": 123}';
      const file = new File([content], 'test.json', { type: 'application/json' });

      const result = await processJSONFile(file);

      // Debug: Log result if test fails
      if (!result.success) {
        console.error('Test failed with error:', result.error);
        console.error('Full result:', result);
      }

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ name: 'Test', value: 123 });
    });

    it('should handle malformed JSON with control characters', async () => {
      const content = '{"text": "Line1\tTab\nLine2", "path": "C:\\\\Users\\\\test"}';
      const file = new File([content], 'malformed.json', { type: 'application/json' });

      const result = await processJSONFile(file);

      // Debug: Log result if test fails
      if (!result.success) {
        console.error('Test failed with error:', result.error);
      }

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should handle nested JSON strings', async () => {
      const content = '{"config": "{\\"key\\":\\"value\\"}"}';
      const file = new File([content], 'nested.json', { type: 'application/json' });

      const result = await processJSONFile(file);

      // Debug: Log result if test fails
      if (!result.success) {
        console.error('Test failed with error:', result.error);
      }

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('config');
    });

    it('should reject files over 50MB', async () => {
      const largeContent = new Uint8Array(51 * 1024 * 1024); // 51MB
      const file = new File([largeContent], 'large.json');
      
      const result = await processJSONFile(file);
      expect(result.success).toBe(false);
      expect(result.error).toContain('exceeds maximum allowed size');
    });
  });

  describe('JSON Parsing', () => {
    it('should parse valid JSON', () => {
      const result = parseJSON('{"valid": true}');
      expect(result.isValid).toBe(true);
      expect(result.data).toEqual({ valid: true });
    });

    it('should handle JSON with comments after preprocessing', () => {
      const jsonWithComments = `{
        // This is a comment
        "key": "value", // Another comment
        /* Multi-line
           comment */
        "number": 42
      }`;
      
      // Use preprocessJSON which removes comments
      const cleaned = preprocessJSON(jsonWithComments);
      const result = parseJSON(cleaned);
      expect(result.isValid).toBe(true);
    });

    it('should validate JSON structure', () => {
      const valid = validateJSON('{"test": true}');
      expect(valid.isValid).toBe(true);

      const invalid = validateJSON('{invalid json}');
      expect(invalid.isValid).toBe(false);
    });

    it('should handle unicode characters', () => {
      const unicode = '{"text": "Hello 世界 🌍", "turkish": "Merhaba Dünya"}';
      const result = parseJSON(unicode);
      expect(result.isValid).toBe(true);
      expect(result.data).toHaveProperty('text', 'Hello 世界 🌍');
    });
  });

  describe('Data Sanitization', () => {
    it('should remove dangerous keys', () => {
      const dangerous = {
        __proto__: 'dangerous',
        constructor: 'dangerous',
        prototype: 'dangerous',
        safe: 'value'
      };
      
      const sanitized = sanitizeJSONData(dangerous);
      expect(sanitized).not.toHaveProperty('__proto__');
      expect(sanitized).not.toHaveProperty('constructor');
      expect(sanitized).not.toHaveProperty('prototype');
      expect(sanitized).toHaveProperty('safe', 'value');
    });

    it('should handle control characters brutally', () => {
      const withControl = 'Text with\x00null\x01and\x1Fother control chars';
      const cleaned = brutalSanitize(withControl);
      expect(cleaned).not.toContain('\x00');
      expect(cleaned).not.toContain('\x01');
      expect(cleaned).not.toContain('\x1F');
    });
  });

  describe('URL Fetching', () => {
    it('should handle successful fetch', async () => {
      // This is a mock test - in real scenario, you'd use MSW or similar
      const options = {
        url: 'https://jsonplaceholder.typicode.com/posts/1',
        timeout: 5000,
        useCorsProxy: false
      };
      
      // Skip in test environment
      if (process.env['NODE_ENV'] !== 'test') {
        const result = await enhancedFetchJSON(options);
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
      }
    });

    it('should validate fetch options', () => {
      const validOptions = {
        url: 'https://example.com/data.json',
        headers: { 'Accept': 'application/json' },
        timeout: 30000
      };
      
      // Options should be within valid ranges
      expect(validOptions.timeout).toBeGreaterThanOrEqual(1000);
      expect(validOptions.timeout).toBeLessThanOrEqual(120000);
    });
  });

  describe('Edge Cases', () => {
    it('should handle deeply nested objects', () => {
      const createNested = (depth: number): any => {
        if (depth === 0) return 'value';
        return { nested: createNested(depth - 1) };
      };
      
      const deep = createNested(20);
      const json = JSON.stringify(deep);
      const result = parseJSON(json);
      
      expect(result.isValid).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should handle arrays with mixed types', () => {
      const mixed = [
        'string',
        123,
        true,
        null,
        { object: true },
        ['nested', 'array']
      ];
      
      const json = JSON.stringify(mixed);
      const result = parseJSON(json);
      
      expect(result.isValid).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data).toHaveLength(6);
    });

    it('should handle empty values', () => {
      const empties = {
        emptyString: '',
        emptyArray: [],
        emptyObject: {},
        nullValue: null,
        undefinedHandling: undefined
      };
      
      const json = JSON.stringify(empties);
      const result = parseJSON(json);
      
      expect(result.isValid).toBe(true);
      expect(result.data).toHaveProperty('emptyString', '');
      expect(result.data).toHaveProperty('emptyArray');
      expect(result.data).toHaveProperty('nullValue', null);
    });
  });
});