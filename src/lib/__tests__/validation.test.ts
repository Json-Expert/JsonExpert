import { describe, it, expect } from 'vitest';

import { validateFile, fileUploadSchema, urlFetchSchema, exportOptionsSchema } from '../validation';

describe('Validation', () => {
  describe('validateFile', () => {
    it('should validate JSON files', () => {
      const file = new File(['{"test": true}'], 'test.json', { type: 'application/json' });
      const result = validateFile(file);
      
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject non-JSON files', () => {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const result = validateFile(file);
      
      expect(result.isValid).toBe(false);
      expect(result.error?.toLowerCase()).toContain('json');
    });

    it('should reject files over 50MB', () => {
      const file = new File(['a'], 'large.json', { type: 'application/json' });
      Object.defineProperty(file, 'size', { value: 51 * 1024 * 1024 });
      const result = validateFile(file);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('50MB');
    });

    it('should accept .txt files with JSON content', () => {
      const file = new File(['{"test": true}'], 'data.txt', { type: 'text/plain' });
      const result = validateFile(file);
      
      expect(result.isValid).toBe(true);
    });
  });

  describe('fileUploadSchema', () => {
    it('should validate file upload data', () => {
      const data = {
        name: 'test.json',
        size: 1024,
        type: 'application/json',
      };
      
      expect(() => fileUploadSchema.parse(data)).not.toThrow();
    });

    it('should not reject based on file extension in schema', () => {
      const data = {
        name: 'test.exe',
        size: 1024,
        type: 'application/x-executable',
      };
      
      expect(() => fileUploadSchema.parse(data)).not.toThrow();
    });
  });

  describe('urlFetchSchema', () => {
    it('should validate URL fetch config', () => {
      const config = {
        url: 'https://api.example.com/data.json',
        headers: { 'Authorization': 'Bearer token' },
        timeout: 5000,
      };
      
      expect(() => urlFetchSchema.parse(config)).not.toThrow();
    });

    it('should reject invalid URLs', () => {
      const config = {
        url: 'not a url',
      };
      
      expect(() => urlFetchSchema.parse(config)).toThrow();
    });

    it('should provide default timeout', () => {
      const config = {
        url: 'https://example.com',
      };
      
      const parsed = urlFetchSchema.parse(config);
      expect(parsed.timeout).toBe(10000);
    });

    it('should validate timeout range', () => {
      const tooShort = { url: 'https://example.com', timeout: 500 };
      const tooLong = { url: 'https://example.com', timeout: 60000 };
      
      expect(() => urlFetchSchema.parse(tooShort)).toThrow();
      expect(() => urlFetchSchema.parse(tooLong)).toThrow();
    });
  });

  describe('exportOptionsSchema', () => {
    it('should validate export options', () => {
      const options = {
        format: 'json',
        fileName: 'export.json',
        quality: 0.9,
        prettify: true,
      };
      
      expect(() => exportOptionsSchema.parse(options)).not.toThrow();
    });

    it('should validate format enum', () => {
      const invalidFormat = {
        format: 'xml',
      };
      
      expect(() => exportOptionsSchema.parse(invalidFormat)).toThrow();
    });

    it('should validate quality range', () => {
      const tooLow = { format: 'png', quality: 0 };
      const tooHigh = { format: 'png', quality: 2 };
      
      expect(() => exportOptionsSchema.parse(tooLow)).toThrow();
      expect(() => exportOptionsSchema.parse(tooHigh)).toThrow();
    });

    it('should provide default values', () => {
      const minimal = { format: 'json' };
      const parsed = exportOptionsSchema.parse(minimal);
      
      expect(parsed.quality).toBe(1);
      expect(parsed.prettify).toBe(true);
    });
  });
});