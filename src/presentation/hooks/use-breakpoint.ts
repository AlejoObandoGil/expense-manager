'use client';

import { useState, useEffect } from 'react';

type Breakpoint = 'mobile' | 'tablet' | 'desktop' | 'large';

const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
};

export function useBreakpoint(): {
  breakpoint: Breakpoint;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  width: number;
} {
  const [width, setWidth] = useState(0);
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('mobile');

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      setWidth(w);

      if (w < breakpoints.md) {
        setBreakpoint('mobile');
      } else if (w < breakpoints.lg) {
        setBreakpoint('tablet');
      } else if (w < breakpoints.xl) {
        setBreakpoint('desktop');
      } else {
        setBreakpoint('large');
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    breakpoint,
    isMobile: breakpoint === 'mobile',
    isTablet: breakpoint === 'tablet',
    isDesktop: breakpoint === 'desktop' || breakpoint === 'large',
    width,
  };
}
