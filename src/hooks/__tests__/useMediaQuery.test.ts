import { renderHook } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { useMediaQuery, useIsMobile, useIsTablet, useIsDesktop } from '../useMediaQuery';

describe('useMediaQuery', () => {
  let matchMedia: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    matchMedia = vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    window.matchMedia = matchMedia as any;
  });

  it('should return false when query does not match', () => {
    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    expect(result.current).toBe(false);
  });

  it('should return true when query matches', () => {
    matchMedia.mockImplementation(() => ({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    expect(result.current).toBe(true);
  });

  it('should update when media query changes', () => {
    let listener: ((event: MediaQueryListEvent) => void) | undefined;
    const mockMatchMedia = {
      matches: false,
      addEventListener: vi.fn((_event, cb) => { listener = cb; }),
      removeEventListener: vi.fn(),
    };
    matchMedia.mockImplementation(() => mockMatchMedia);

    const { result, rerender } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    expect(result.current).toBe(false);

    // Simulate media query change
    mockMatchMedia.matches = true;
    listener?.({ matches: true } as MediaQueryListEvent);
    rerender();

    expect(result.current).toBe(true);
  });

  describe('Convenience hooks', () => {
    it('useIsMobile should check max-width 768px', () => {
      renderHook(() => useIsMobile());
      expect(matchMedia).toHaveBeenCalledWith('(max-width: 768px)');
    });

    it('useIsTablet should check tablet range', () => {
      renderHook(() => useIsTablet());
      expect(matchMedia).toHaveBeenCalledWith('(min-width: 769px) and (max-width: 1024px)');
    });

    it('useIsDesktop should check min-width 1025px', () => {
      renderHook(() => useIsDesktop());
      expect(matchMedia).toHaveBeenCalledWith('(min-width: 1025px)');
    });
  });
});