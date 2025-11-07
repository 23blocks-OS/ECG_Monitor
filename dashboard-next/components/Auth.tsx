'use client';

import React, { createContext, useContext, ReactNode } from 'react';

interface User {
  name?: string;
  email?: string;
  organizationId?: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  signOut: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const user: User = {
    name: 'Demo User',
    email: 'demo@example.com',
  };

  const signOut = async () => {
    // Stub implementation
  };

  const signIn = async (email: string, password: string) => {
    // Stub implementation
  };

  return (
    <AuthContext.Provider value={{ user, signOut, signIn }}>
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

export function ProtectedRoute({ children }: { children: ReactNode }) {
  // Stub implementation - always allow access
  return <>{children}</>;
}

export function LoginForm({ onSuccess, onForgotPassword }: { onSuccess?: () => void; onForgotPassword?: () => void }) {
  return (
    <div className="p-8 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Login</h2>
      <p className="text-gray-600">Login form placeholder</p>
    </div>
  );
}

export function SignUpForm({ onSuccess }: { onSuccess?: (email: string) => void }) {
  return (
    <div className="p-8 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Sign Up</h2>
      <p className="text-gray-600">Sign up form placeholder</p>
    </div>
  );
}
