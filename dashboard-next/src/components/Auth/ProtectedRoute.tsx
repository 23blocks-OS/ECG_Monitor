/**
 * Protected Route Component
 *
 * Wrapper component that protects routes requiring authentication.
 * Redirects to login if user is not authenticated.
 *
 * Usage:
 *   <ProtectedRoute>
 *     <DashboardPage />
 *   </ProtectedRoute>
 *
 *   // With required role
 *   <ProtectedRoute requiredRole="admin">
 *     <AdminPanel />
 *   </ProtectedRoute>
 */

'use client';

import React, { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string;
  redirectTo?: string;
  fallback?: ReactNode;
}

export function ProtectedRoute({
  children,
  requiredRole,
  redirectTo = '/login',
  fallback,
}: ProtectedRouteProps) {
  const { isAuthenticated, loading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, loading, redirectTo, router]);

  // Show loading state
  if (loading) {
    return fallback || <LoadingSpinner />;
  }

  // Not authenticated - don't render children (redirect will happen)
  if (!isAuthenticated) {
    return fallback || <LoadingSpinner />;
  }

  // Check role requirement if specified
  if (requiredRole && user?.role !== requiredRole) {
    return <UnauthorizedMessage requiredRole={requiredRole} />;
  }

  // Authenticated and authorized - render children
  return <>{children}</>;
}

/**
 * Default loading spinner
 */
function LoadingSpinner() {
  return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p>Loading...</p>

      <style jsx>{`
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          color: #666;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #0066cc;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        p {
          margin-top: 1rem;
          font-size: 0.9rem;
        }
      `}</style>
    </div>
  );
}

/**
 * Unauthorized message for role-based access
 */
function UnauthorizedMessage({ requiredRole }: { requiredRole: string }) {
  return (
    <div className="unauthorized-container">
      <div className="unauthorized-card">
        <h2>Access Denied</h2>
        <p>
          You do not have permission to access this page.
          <br />
          Required role: <strong>{requiredRole}</strong>
        </p>
        <a href="/dashboard" className="back-button">
          Back to Dashboard
        </a>
      </div>

      <style jsx>{`
        .unauthorized-container {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: #f5f5f5;
        }

        .unauthorized-card {
          background: white;
          padding: 2rem;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          text-align: center;
          max-width: 400px;
        }

        h2 {
          color: #c33;
          margin: 0 0 1rem 0;
        }

        p {
          color: #666;
          margin: 0 0 1.5rem 0;
          line-height: 1.6;
        }

        .back-button {
          display: inline-block;
          padding: 0.75rem 1.5rem;
          background: #0066cc;
          color: white;
          text-decoration: none;
          border-radius: 4px;
          font-weight: 600;
          transition: background-color 0.2s;
        }

        .back-button:hover {
          background: #0052a3;
        }
      `}</style>
    </div>
  );
}
