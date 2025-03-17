"use client";

import { BACKEND_BASE_URL } from '@/constants/constants';
import { createContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';

export interface UserType {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  account_type: string;
}

export interface AuthContextType {
  isAuthenticated: boolean;
  user: UserType | null;
  refreshAuth: () => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  refreshAuth: async () => {},
  logout: async () => {},
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshAuth = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/auth/me`, {
        method: 'GET',
        credentials: 'include',
      });
      if (res.ok) {
        const userData: UserType = await res.json();
        setIsAuthenticated(true);
        setUser(userData);
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch {
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch(`${BACKEND_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
    }
    setIsAuthenticated(false);
    setUser(null);
    await refreshAuth();
  }, [refreshAuth]);

  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  const contextValue = useMemo(
    () => ({
      isAuthenticated,
      user,
      refreshAuth,
      logout,
      loading,
    }),
    [isAuthenticated, user, refreshAuth, logout, loading]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}
