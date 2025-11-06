/**
 * Authentication Context Provider
 *
 * Provides global authentication state and helpers throughout the app.
 * Automatically checks for existing session on mount.
 *
 * Usage:
 *   // Wrap your app
 *   <AuthProvider>
 *     <App />
 *   </AuthProvider>
 *
 *   // Use in components
 *   const { user, isAuthenticated, loading, signIn, signOut } = useAuth();
 */

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authHelpers } from '@/lib/auth';

interface User {
  email: string;
  name: string;
  organizationId?: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: any }>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string, name: string, organizationId?: string, role?: string) => Promise<{ success: boolean; error?: any }>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const result = await authHelpers.getCurrentUser();
      if (result.success && result.user) {
        // Fetch user attributes
        const attributes = await authHelpers.getUserAttributes();
        if (attributes) {
          setUser({
            email: attributes.email || '',
            name: attributes.name || '',
            organizationId: attributes.organizationId,
            role: attributes.role,
          });
        }
      }
    } catch (error) {
      // No authenticated user - this is normal on first load
      console.debug('No authenticated user found');
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const result = await authHelpers.signIn(email, password);

      if (result.success) {
        // Fetch user attributes after successful sign in
        const attributes = await authHelpers.getUserAttributes();
        if (attributes) {
          setUser({
            email: attributes.email || '',
            name: attributes.name || '',
            organizationId: attributes.organizationId,
            role: attributes.role,
          });
        }
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
    organizationId?: string,
    role?: string
  ) => {
    try {
      const result = await authHelpers.signUp(email, password, name, organizationId, role);
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
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access authentication context
 * Must be used within AuthProvider
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
