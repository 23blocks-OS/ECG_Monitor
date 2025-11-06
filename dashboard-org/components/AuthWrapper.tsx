'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ProviderUser, Organization } from '@/types';

interface AuthContextType {
  user: ProviderUser | null;
  organization: Organization | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  organization: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  logout: () => {}
});

export function useAuth() {
  return useContext(AuthContext);
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<ProviderUser | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Check localStorage for session
      const storedUser = localStorage.getItem('provider_user');
      const storedOrg = localStorage.getItem('organization');

      if (storedUser && storedOrg) {
        setUser(JSON.parse(storedUser));
        setOrganization(JSON.parse(storedOrg));
      } else {
        // Try to validate session with backend
        // TODO: Replace with actual API call
        const mockAuth = getMockAuth();
        if (mockAuth) {
          setUser(mockAuth.user);
          setOrganization(mockAuth.organization);
          localStorage.setItem('provider_user', JSON.stringify(mockAuth.user));
          localStorage.setItem('organization', JSON.stringify(mockAuth.organization));
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setOrganization(data.organization);
        localStorage.setItem('provider_user', JSON.stringify(data.user));
        localStorage.setItem('organization', JSON.stringify(data.organization));
      } else {
        // Mock login for development
        const mockAuth = getMockAuth();
        setUser(mockAuth.user);
        setOrganization(mockAuth.organization);
        localStorage.setItem('provider_user', JSON.stringify(mockAuth.user));
        localStorage.setItem('organization', JSON.stringify(mockAuth.organization));
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setOrganization(null);
    localStorage.removeItem('provider_user');
    localStorage.removeItem('organization');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        organization,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

interface AuthWrapperProps {
  children: ReactNode;
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const { isAuthenticated, isLoading, user, organization } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await login(email, password);
    } catch (err) {
      setError('Invalid credentials. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-accent-purple mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 shadow-2xl">
            {/* Logo/Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-accent-purple to-accent-pink rounded-2xl mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Provider Portal</h1>
              <p className="text-gray-400">Sign in to access patient monitoring</p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-purple focus:border-transparent transition-all"
                  placeholder="doctor@clinic.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-purple focus:border-transparent transition-all"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-3 text-red-300 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-accent-purple to-accent-pink text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-500/50 transition-all"
              >
                Sign In
              </button>
            </form>

            {/* Development Note */}
            <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <p className="text-xs text-blue-300 text-center">
                Development Mode: Any credentials will work
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// Mock authentication data for development
function getMockAuth() {
  return {
    user: {
      user_id: 'provider-001-uuid',
      organization_id: 'org-001-uuid',
      email: 'dr.johnson@clinic.com',
      first_name: 'Robert',
      last_name: 'Johnson',
      role: 'doctor' as const,
      account_status: 'active' as const
    },
    organization: {
      organization_id: 'org-001-uuid',
      organization_name: 'Downtown Family Clinic',
      organization_type: 'clinic' as const,
      settings: {
        timezone: 'America/Chicago',
        max_users: 100,
        max_devices: 20,
        retention_days: 365
      },
      subscription: {
        plan: 'professional',
        status: 'active' as const
      }
    }
  };
}
