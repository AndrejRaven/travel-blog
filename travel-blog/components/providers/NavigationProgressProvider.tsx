"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import { usePathname, useSearchParams } from "next/navigation";

interface NavigationProgressContextType {
  isNavigating: boolean;
  setNavigating: (navigating: boolean) => void;
  activeElement: HTMLElement | null;
  setActiveElement: (element: HTMLElement | null) => void;
}

const NavigationProgressContext = createContext<
  NavigationProgressContextType | undefined
>(undefined);

export function useNavigationProgress() {
  const context = useContext(NavigationProgressContext);
  if (context === undefined) {
    throw new Error(
      "useNavigationProgress must be used within a NavigationProgressProvider"
    );
  }
  return context;
}

interface NavigationProgressProviderProps {
  children: React.ReactNode;
}

export default function NavigationProgressProvider({
  children,
}: NavigationProgressProviderProps) {
  const [isNavigating, setIsNavigating] = useState(false);
  const [activeElement, setActiveElement] = useState<HTMLElement | null>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Reset navigation state when route changes
  useEffect(() => {
    // Clear any pending timeout first
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Reset state immediately
    setIsNavigating(false);
    setActiveElement(null);
  }, [pathname, searchParams]);

  const setNavigating = (navigating: boolean) => {
    if (navigating) {
      // Show loading bar only if navigation takes longer than 50ms
      timeoutRef.current = setTimeout(() => {
        setIsNavigating(true);
      }, 50);
    } else {
      // Clear timeout and reset state immediately
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setIsNavigating(false);
      setActiveElement(null);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const value: NavigationProgressContextType = {
    isNavigating,
    setNavigating,
    activeElement,
    setActiveElement,
  };

  return (
    <NavigationProgressContext.Provider value={value}>
      {children}
    </NavigationProgressContext.Provider>
  );
}
