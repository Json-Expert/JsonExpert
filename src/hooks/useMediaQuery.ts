import { useState, useEffect } from 'react';

/**
 * Custom hook for responsive design using CSS media queries
 *
 * This hook subscribes to a media query and returns whether it currently matches.
 * It automatically updates when the viewport size changes.
 *
 * @param query - CSS media query string (e.g., "(min-width: 768px)")
 * @returns `true` if the media query matches, `false` otherwise
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const isWide = useMediaQuery('(min-width: 1200px)');
 *
 *   return (
 *     <div>
 *       {isWide ? <WideLayout /> : <NarrowLayout />}
 *     </div>
 *   );
 * }
 * ```
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

  useEffect(() => {
    const media = window.matchMedia(query);
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
}

/**
 * Check if the current viewport is mobile-sized
 *
 * @returns `true` if viewport width is 768px or less
 *
 * @example
 * ```tsx
 * function MobileMenu() {
 *   const isMobile = useIsMobile();
 *
 *   return isMobile ? <HamburgerMenu /> : <FullMenu />;
 * }
 * ```
 */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 768px)');
}

/**
 * Check if the current viewport is tablet-sized
 *
 * @returns `true` if viewport width is between 769px and 1024px
 *
 * @example
 * ```tsx
 * function ResponsiveGrid() {
 *   const isTablet = useIsTablet();
 *
 *   return <div className={isTablet ? 'grid-cols-2' : 'grid-cols-3'} />;
 * }
 * ```
 */
export function useIsTablet(): boolean {
  return useMediaQuery('(min-width: 769px) and (max-width: 1024px)');
}

/**
 * Check if the current viewport is desktop-sized
 *
 * @returns `true` if viewport width is 1025px or more
 *
 * @example
 * ```tsx
 * function Dashboard() {
 *   const isDesktop = useIsDesktop();
 *
 *   return isDesktop ? <MultiColumnLayout /> : <SingleColumnLayout />;
 * }
 * ```
 */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1025px)');
}