import { describe, it, expect } from 'vitest';

import {
  parseJSON,
  stringifyJSON,
  validateJSON,
  detectJSONType,
  getJSONStats,
} from '../json-parser';

describe('JSON Parser', () => {
  describe('parseJSON', () => {
    it('should parse valid JSON', () => {
      const result = parseJSON('{"name": "test", "value": 123}');
      expect(result.isValid).toBe(true);
      expect(result.data).toEqual({ name: 'test', value: 123 });
      expect(result.error).toBeNull();
    });

    it('should handle invalid JSON', () => {
      const result = parseJSON('invalid json');
      expect(result.isValid).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toBeTruthy();
    });

    it('should handle empty input', () => {
      const result = parseJSON('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Empty input');
    });

    it('should handle arrays', () => {
      const result = parseJSON('[1, 2, 3]');
      expect(result.isValid).toBe(true);
      expect(result.data).toEqual([1, 2, 3]);
    });

    it('should handle primitive values', () => {
      expect(parseJSON('123').data).toBe(123);
      expect(parseJSON('"string"').data).toBe('string');
      expect(parseJSON('true').data).toBe(true);
      expect(parseJSON('null').data).toBe(null);
    });
  });

  describe('stringifyJSON', () => {
    it('should stringify objects with default spacing', () => {
      const data = { name: 'test', value: 123 };
      const result = stringifyJSON(data);
      expect(result).toBe('{\n  "name": "test",\n  "value": 123\n}');
    });

    it('should stringify with custom spacing', () => {
      const data = { a: 1 };
      expect(stringifyJSON(data, 0)).toBe('{"a":1}');
      expect(stringifyJSON(data, 4)).toBe('{\n    "a": 1\n}');
    });
  });

  describe('validateJSON', () => {
    it('should validate correct JSON', () => {
      const result = validateJSON('{"valid": true}');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should provide error position for invalid JSON', () => {
      const result = validateJSON('{"invalid": }');
      expect(result.isValid).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });

  describe('detectJSONType', () => {
    it('should detect correct types', () => {
      expect(detectJSONType(null)).toBe('null');
      expect(detectJSONType([])).toBe('array');
      expect(detectJSONType({})).toBe('object');
      expect(detectJSONType('string')).toBe('string');
      expect(detectJSONType(123)).toBe('number');
      expect(detectJSONType(true)).toBe('boolean');
    });
  });

  describe('getJSONStats', () => {
    it('should calculate stats for simple object', () => {
      const data = {
        name: 'test',
        age: 30,
        active: true,
        address: null,
      };
      const stats = getJSONStats(data);
      
      expect(stats.totalKeys).toBe(4);
      expect(stats.totalValues).toBe(4);
      expect(stats.maxDepth).toBe(1);
      expect(stats.types['string']).toBe(1);
      expect(stats.types['number']).toBe(1);
      expect(stats.types['boolean']).toBe(1);
      expect(stats.types['null']).toBe(1);
    });

    it('should calculate stats for nested structures', () => {
      const data = {
        users: [
          { name: 'Alice', scores: [10, 20] },
          { name: 'Bob', scores: [15, 25] },
        ],
      };
      const stats = getJSONStats(data);
      
      expect(stats.maxDepth).toBe(4);
      expect(stats.types['array']).toBe(3);
      expect(stats.types['object']).toBe(3);
      expect(stats.types['string']).toBe(2);
      expect(stats.types['number']).toBe(4);
    });
  });
});