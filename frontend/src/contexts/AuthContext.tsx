import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../api/client';
import toast from 'react-hot-toast';

export interface FarmerProfile {
  cooperative?: { id: string; name: string };
  province?: string;
  district?: string;
  sector?: string;
  farm_size_hectares?: number;
  land_ownership?: string;
  years_of_experience?: number;
  crop_types?: string[];
  farmer_code?: string;
}

export interface AuthUser {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: 'admin' | 'cooperative' | 'farmer';
  status: string;
  gender?: string;
  national_id?: string;
  profile_image?: string;
  last_login?: string;
  created_at?: string;
  is_verified?: boolean;
  farmer_profile?: FarmerProfile;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    if (!token) { setIsLoading(false); return; }
    try {
      const profile = await authAPI.profile() as any;
      setUser(profile);
    } catch {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  const login = async (credentials: any) => {
    const result = await authAPI.login(credentials) as any;
    const { access_token, refresh_token, user: userData } = result.data;
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('refresh_token', refresh_token);
    setUser(userData);
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) await authAPI.logout(refreshToken);
    } catch { /* ignore */ } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
    }
  };

  const refreshUser = useCallback(async () => {
    await loadUser();
  }, [loadUser]);

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
