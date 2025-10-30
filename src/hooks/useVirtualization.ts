import { useRef, useCallback, useState, useEffect } from 'react';

/**
 * Configuration options for virtualization
 */
interface VirtualizationOptions {
  /** Height of each individual item in pixels */
  itemHeight: number;
  /** Height of the container/viewport in pixels */
  containerHeight: number;
  /** Total number of items in the list */
  totalItems: number;
  /** Number of extra items to render above and below the viewport (default: 3) */
  overscan?: number;
}

/**
 * Custom hook for virtualizing large lists to improve performance
 *
 * This hook implements windowing/virtualization by only rendering items that are
 * visible in the viewport, plus a small overscan buffer. This dramatically improves
 * performance for large datasets (thousands of items).
 *
 * @param options - Virtualization configuration
 * @param options.itemHeight - Height of each item in pixels (must be fixed)
 * @param options.containerHeight - Height of the scrollable container
 * @param options.totalItems - Total number of items in the full list
 * @param options.overscan - Number of items to render outside viewport (default: 3)
 *
 * @returns Virtualization state and utilities
 * @returns scrollRef - Ref to attach to the scrollable container
 * @returns virtualHeight - Total height of all items (for proper scrollbar)
 * @returns offsetY - Offset for positioning visible items correctly
 * @returns startIndex - Index of first visible item
 * @returns endIndex - Index of last visible item
 * @returns visibleItems - Number of currently visible items
 *
 * @example
 * ```tsx
 * const { scrollRef, virtualHeight, offsetY, startIndex, endIndex } = useVirtualization({
 *   itemHeight: 50,
 *   containerHeight: 400,
 *   totalItems: 10000,
 *   overscan: 5,
 * });
 *
 * return (
 *   <div ref={scrollRef} style={{ height: 400, overflow: 'auto' }}>
 *     <div style={{ height: virtualHeight, position: 'relative' }}>
 *       <div style={{ transform: `translateY(${offsetY}px)` }}>
 *         {items.slice(startIndex, endIndex + 1).map(item => (
 *           <div key={item.id} style={{ height: 50 }}>{item.name}</div>
 *         ))}
 *       </div>
 *     </div>
 *   </div>
 * );
 * ```
 */
export function useVirtualization({
  itemHeight,
  containerHeight,
  totalItems,
  overscan = 3,
}: VirtualizationOptions) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const visibleItemCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    totalItems - 1,
    startIndex + visibleItemCount + overscan * 2
  );

  const virtualHeight = totalItems * itemHeight;
  const offsetY = startIndex * itemHeight;

  const handleScroll = useCallback(() => {
    if (scrollRef.current) {
      setScrollTop(scrollRef.current.scrollTop);
    }
  }, []);

  useEffect(() => {
    const element = scrollRef.current;
    if (element) {
      element.addEventListener('scroll', handleScroll, { passive: true });
      return () => element.removeEventListener('scroll', handleScroll);
    }
    return undefined;
  }, [handleScroll]);

  return {
    scrollRef,
    virtualHeight,
    offsetY,
    startIndex,
    endIndex,
    visibleItems: endIndex - startIndex + 1,
  };
}