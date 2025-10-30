import { useEffect, useLayoutEffect, useRef } from 'react';

export function usePerformanceMonitor(componentName: string) {
  const renderCount = useRef(0);
  const renderStartTime = useRef<number | null>(null);

  useLayoutEffect(() => {
    renderStartTime.current = performance.now();
  });

  useEffect(() => {
    renderCount.current += 1;
    const renderEndTime = performance.now();
    
    if (renderStartTime.current) {
      const renderTime = renderEndTime - renderStartTime.current;
      
      if (import.meta.env?.DEV && renderTime > 16) {
        console.warn(
          `[Performance] ${componentName} render took ${renderTime.toFixed(2)}ms (renders: ${renderCount.current})`
        );
      }
    }
  });
}

export function measurePerformance<T extends (...args: unknown[]) => unknown>(
  fn: T,
  name: string
): T {
  return ((...args: Parameters<T>) => {
    const start = performance.now();
    const result = fn(...args);
    const end = performance.now();
    
    if (import.meta.env?.DEV && end - start > 10) {
      console.log(`[Performance] ${name} took ${(end - start).toFixed(2)}ms`);
    }
    
    return result;
  }) as T;
}