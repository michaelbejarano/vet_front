import {
  createContext,
  useCallback,
  useEffect,
  useState,
} from 'react';

import type { ReactNode } from 'react';

import { useLocation } from 'react-router-dom';

interface SidebarContextValue {
  mobileOpen: boolean;
  isCollapsed: boolean;
  toggleMobile: () => void;
  toggleCollapse: () => void;
  closeMobile: () => void;
}

export const SidebarContext =
  createContext<SidebarContextValue | null>(null);

interface SidebarProviderProps {
  children: ReactNode;
}

export function SidebarProvider({
  children,
}: SidebarProviderProps) {
  const [mobileOpen, setMobileOpen] =
    useState(false);

  const [isCollapsed, setIsCollapsed] =
    useState(false);

  const location = useLocation();

  const toggleMobile = useCallback(() => {
    setMobileOpen((previous) => !previous);
  }, []);

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((previous) => !previous);
  }, []);

  const closeMobile = useCallback(() => {
    setMobileOpen(false);
  }, []);

  useEffect(() => {
    closeMobile();
  }, [location.pathname, closeMobile]);

  return (
    <SidebarContext.Provider
      value={{
        mobileOpen,
        isCollapsed,
        toggleMobile,
        toggleCollapse,
        closeMobile,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}