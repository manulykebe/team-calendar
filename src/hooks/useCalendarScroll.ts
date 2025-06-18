import { useEffect, useRef, useState } from 'react';
import { addWeeks, subWeeks } from 'date-fns';

interface UseCalendarScrollProps {
  currentMonth: Date;
  setCurrentMonth: (date: Date) => void;
}

export function useCalendarScroll({ currentMonth, setCurrentMonth }: UseCalendarScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);
  const lastScrollY = useRef<number>(0);
  const touchStartY = useRef<number | null>(null);

  // Handle wheel scrolling
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      
      // Determine scroll direction and sensitivity
      const scrollThreshold = 50;
      const delta = e.deltaY;
      
      if (Math.abs(delta) < scrollThreshold) return;
      
      if (delta > 0) {
        // Scroll down - go to next week
        setCurrentMonth(addWeeks(currentMonth, 1));
      } else {
        // Scroll up - go to previous week
        setCurrentMonth(subWeeks(currentMonth, 1));
      }
      
      // Set scrolling state to prevent multiple rapid changes
      if (!isScrolling) {
        setIsScrolling(true);
        
        // Clear any existing timeout
        if (scrollTimeout.current) {
          clearTimeout(scrollTimeout.current);
        }
        
        // Set a timeout to reset scrolling state
        scrollTimeout.current = setTimeout(() => {
          setIsScrolling(false);
        }, 200);
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      container.removeEventListener('wheel', handleWheel);
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, [currentMonth, setCurrentMonth, isScrolling]);

  // Handle touch events for mobile
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (touchStartY.current === null) return;
      
      const touchY = e.touches[0].clientY;
      const diff = touchStartY.current - touchY;
      
      // Require a minimum movement to trigger a week change
      const touchThreshold = 50;
      
      if (Math.abs(diff) > touchThreshold) {
        if (diff > 0) {
          // Swipe up - go to next week
          setCurrentMonth(addWeeks(currentMonth, 1));
        } else {
          // Swipe down - go to previous week
          setCurrentMonth(subWeeks(currentMonth, 1));
        }
        
        // Reset touch start to prevent multiple triggers in one gesture
        touchStartY.current = null;
      }
    };

    const handleTouchEnd = () => {
      touchStartY.current = null;
    };

    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchmove', handleTouchMove);
    container.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [currentMonth, setCurrentMonth]);

  return { containerRef };
}