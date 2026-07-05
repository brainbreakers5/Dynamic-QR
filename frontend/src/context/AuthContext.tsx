'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '@/utils/api';
import { useRouter } from 'next/navigation';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'admin';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if token exists in localStorage on mount
    const savedToken = localStorage.getItem('qr_auth_token');
    const savedUser = localStorage.getItem('qr_user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('qr_auth_token');
        localStorage.removeItem('qr_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await apiRequest('/auth/login', 'POST', { email, password });
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('qr_auth_token', res.token);
      localStorage.setItem('qr_user', JSON.stringify(res.user));
      setLoading(false);
      router.push('/dashboard');
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    setLoading(true);
    try {
      const res = await apiRequest('/auth/signup', 'POST', { name, email, password });
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('qr_auth_token', res.token);
      localStorage.setItem('qr_user', JSON.stringify(res.user));
      setLoading(false);
      router.push('/dashboard');
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('qr_auth_token');
    localStorage.removeItem('qr_user');
    setToken(null);
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout }}>
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
