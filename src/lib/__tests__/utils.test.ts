import { describe, it, expect, vi } from 'vitest';

import { cn, formatBytes, debounce, truncate, copyToClipboard } from '../utils';

describe('Utils', () => {
  describe('cn (classname utility)', () => {
    it('should combine class names', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2');
    });

    it('should handle conditional classes', () => {
      expect(cn('base', false && 'conditional', 'other')).toBe('base other');
      expect(cn('base', true && 'conditional')).toBe('base conditional');
    });

    it('should merge Tailwind classes correctly', () => {
      expect(cn('p-4', 'p-2')).toBe('p-2');
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
    });

    it('should handle arrays and objects', () => {
      expect(cn(['class1', 'class2'])).toBe('class1 class2');
      expect(cn({ active: true, disabled: false })).toBe('active');
    });
  });

  describe('formatBytes', () => {
    it('should format bytes to human readable', () => {
      expect(formatBytes(0)).toBe('0 Bytes');
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1048576)).toBe('1 MB');
      expect(formatBytes(1073741824)).toBe('1 GB');
    });

    it('should handle decimal places', () => {
      expect(formatBytes(1536, 0)).toBe('2 KB');
      expect(formatBytes(1536, 1)).toBe('1.5 KB');
      expect(formatBytes(1536, 2)).toBe('1.5 KB');
    });

    it('should handle large numbers', () => {
      expect(formatBytes(1099511627776)).toBe('1 TB');
    });
  });

  describe('debounce', () => {
    it('should debounce function calls', async () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100);

      debounced();
      debounced();
      debounced();

      expect(fn).not.toHaveBeenCalled();

      await new Promise(resolve => setTimeout(resolve, 150));
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should pass arguments correctly', async () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 50);

      debounced('arg1', 'arg2');

      await new Promise(resolve => setTimeout(resolve, 100));
      expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('should cancel previous calls', async () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100);

      debounced('first');
      await new Promise(resolve => setTimeout(resolve, 50));
      debounced('second');

      await new Promise(resolve => setTimeout(resolve, 150));
      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith('second');
    });
  });

  describe('truncate', () => {
    it('should truncate long strings', () => {
      expect(truncate('Hello, World!', 5)).toBe('Hello...');
      expect(truncate('Short', 10)).toBe('Short');
    });

    it('should handle exact length', () => {
      expect(truncate('12345', 5)).toBe('12345');
    });

    it('should handle empty strings', () => {
      expect(truncate('', 5)).toBe('');
    });
  });

  describe('copyToClipboard', () => {
    it('should use navigator.clipboard when available', async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: { writeText },
      });

      await copyToClipboard('test text');
      expect(writeText).toHaveBeenCalledWith('test text');
    });

    it('should fallback to execCommand when clipboard API not available', async () => {
      const originalClipboard = navigator.clipboard;
      Object.assign(navigator, { clipboard: undefined });

      const execCommand = vi.fn().mockReturnValue(true);
      document.execCommand = execCommand;

      const createElement = vi.spyOn(document, 'createElement');
      const appendChild = vi.spyOn(document.body, 'appendChild');
      const removeChild = vi.spyOn(document.body, 'removeChild');

      await copyToClipboard('test text');

      expect(createElement).toHaveBeenCalledWith('textarea');
      expect(appendChild).toHaveBeenCalled();
      expect(execCommand).toHaveBeenCalledWith('copy');
      expect(removeChild).toHaveBeenCalled();

      Object.assign(navigator, { clipboard: originalClipboard });
    });
  });
});