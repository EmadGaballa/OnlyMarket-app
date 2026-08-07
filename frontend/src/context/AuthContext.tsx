import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '../api/auth';
import { setAccessToken } from '../api/client';
import type { User } from '../types/auth';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    accessToken: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const refreshSession = async () => {
    try {
      const response = await authApi.me();
      setState({
        user: response,
        accessToken: null,
        isLoading: false,
        isAuthenticated: true,
      });
    } catch {
      setState({
        user: null,
        accessToken: null,
        isLoading: false,
        isAuthenticated: false,
      });
    }
  };

  useEffect(() => {
    refreshSession();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
    setAccessToken(response.accessToken);
    setState({
      user: response.user,
      accessToken: response.accessToken,
      isLoading: false,
      isAuthenticated: true,
    });
  };

  const register = async (email: string, password: string, firstName: string, lastName: string) => {
    const response = await authApi.register({ email, password, firstName, lastName });
    setAccessToken(response.accessToken);
    setState({
      user: response.user,
      accessToken: response.accessToken,
      isLoading: false,
      isAuthenticated: true,
    });
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore logout errors
    }
    setAccessToken(null);
    setState({
      user: null,
      accessToken: null,
      isLoading: false,
      isAuthenticated: false,
    });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}