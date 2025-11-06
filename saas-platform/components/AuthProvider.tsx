/**
 * Authentication Context Provider for SaaS Platform
 */

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authHelpers, UserAttributes } from '@/lib/auth';
import { apiClient } from '@/lib/api-client';
import type { Customer } from '@/types';

interface AuthUser extends UserAttributes {
  customer?: Customer;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: any }>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string, name: string, phone?: string) => Promise<{ success: boolean; error?: any }>;
  confirmSignUp: (email: string, code: string) => Promise<{ success: boolean; error?: any }>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const result = await authHelpers.getCurrentUser();
      if (result.success && result.user) {
        const attributes = await authHelpers.getUserAttributes();
        if (attributes) {
          const authUser: AuthUser = { ...attributes };

          // Fetch customer data if customerId exists
          if (attributes.customerId) {
            const customerResult = await apiClient.getCustomer(attributes.customerId);
            if (customerResult.success && customerResult.data) {
              authUser.customer = customerResult.data;
            }
          }

          setUser(authUser);
        }
      }
    } catch (error) {
      console.debug('No authenticated user found');
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const result = await authHelpers.signIn(email, password);

      if (result.success) {
        await checkAuthStatus();
        return { success: true };
      }

      return { success: false, error: result.error };
    } catch (error) {
      return { success: false, error };
    }
  };

  const signOut = async () => {
    await authHelpers.signOut();
    setUser(null);
  };

  const signUp = async (
    email: string,
    password: string,
    name: string,
    phone?: string
  ) => {
    try {
      const result = await authHelpers.signUp(email, password, name, phone);
      return result;
    } catch (error) {
      return { success: false, error };
    }
  };

  const confirmSignUp = async (email: string, code: string) => {
    try {
      const result = await authHelpers.confirmSignUp(email, code);
      return result;
    } catch (error) {
      return { success: false, error };
    }
  };

  const refreshUser = async () => {
    await checkAuthStatus();
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    loading,
    signIn,
    signOut,
    signUp,
    confirmSignUp,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
