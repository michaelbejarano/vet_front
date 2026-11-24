import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import type { ReactNode } from 'react';

import { authService } from '@/services/authService';

import {
  clearSession,
  getSession,
  getTokenExpiry,
  saveSession,
  subscribeSession,
} from '@/services/session';

import type {
  CurrentUser,
  Session,
} from '@/types/auth.types';

interface AuthContextValue {
  user: CurrentUser | null;
  isAuthenticated: boolean;

  login: (
    email: string,
    password: string
  ) => Promise<CurrentUser>;

  logout: () => void;
}

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthContext =
  createContext<AuthContextValue | null>(null);

export function AuthProvider({
  children,
}: AuthProviderProps) {
  const [session, setSession] =
    useState<Session | null>(() => getSession());

  // Sincronizar cambios de sesión
  useEffect(() => {
    return subscribeSession(() => {
      setSession(getSession());
    });
  }, []);

  // Cerrar sesión cuando expire el JWT
  useEffect(() => {
    const token = session?.token;

    if (!token) return;

    const expiry = getTokenExpiry(token);

    if (expiry === null) {
      clearSession();
      return;
    }

    const remaining = expiry - Date.now();

    if (remaining <= 0) {
      clearSession();
      return;
    }

    const timer = window.setTimeout(() => {
      clearSession();
    }, remaining);

    return () => window.clearTimeout(timer);
  }, [session?.token]);

  // Iniciar sesión
  const login = useCallback(
    async (
      email: string,
      password: string
    ): Promise<CurrentUser> => {
      const newSession = await authService.login(
        email,
        password
      );

      saveSession(newSession);
      setSession(newSession);

      return newSession.user;
    },
    []
  );

  // Cerrar sesión
  const logout = useCallback(() => {
    clearSession();
    setSession(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      isAuthenticated: Boolean(session?.token),
      login,
      logout,
    }),
    [session, login, logout]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}