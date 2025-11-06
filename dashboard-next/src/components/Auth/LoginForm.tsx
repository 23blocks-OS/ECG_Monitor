/**
 * Login Form Component
 *
 * Provides email/password authentication with error handling.
 * Integrates with AuthProvider for global state management.
 *
 * Usage:
 *   <LoginForm onSuccess={() => router.push('/dashboard')} />
 */

'use client';

import React, { useState } from 'react';
import { useAuth } from './AuthProvider';

interface LoginFormProps {
  onSuccess?: () => void;
  onForgotPassword?: () => void;
  className?: string;
}

export function LoginForm({ onSuccess, onForgotPassword, className = '' }: LoginFormProps) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn(email, password);

      if (result.success) {
        if (onSuccess) {
          onSuccess();
        }
      } else {
        // Handle specific error types
        const errorMessage = getErrorMessage(result.error);
        setError(errorMessage);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getErrorMessage = (error: any): string => {
    if (!error) return 'Sign in failed. Please try again.';

    const errorCode = error.code || error.name;

    switch (errorCode) {
      case 'UserNotFoundException':
        return 'No account found with this email address.';
      case 'NotAuthorizedException':
        return 'Incorrect email or password.';
      case 'UserNotConfirmedException':
        return 'Please verify your email address before signing in.';
      case 'PasswordResetRequiredException':
        return 'Password reset required. Please reset your password.';
      case 'TooManyFailedAttemptsException':
        return 'Too many failed attempts. Please try again later.';
      case 'InvalidParameterException':
        return 'Invalid email or password format.';
      default:
        return error.message || 'Sign in failed. Please try again.';
    }
  };

  return (
    <div className={`login-form ${className}`}>
      <form onSubmit={handleSubmit}>
        <h2>Sign In</h2>

        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            disabled={loading}
            autoComplete="email"
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            disabled={loading}
            autoComplete="current-password"
          />
        </div>

        {onForgotPassword && (
          <div className="forgot-password">
            <button
              type="button"
              onClick={onForgotPassword}
              className="link-button"
              disabled={loading}
            >
              Forgot password?
            </button>
          </div>
        )}

        <button type="submit" className="submit-button" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <style jsx>{`
        .login-form {
          max-width: 400px;
          margin: 0 auto;
        }

        form {
          background: white;
          padding: 2rem;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        h2 {
          margin: 0 0 1.5rem 0;
          color: #333;
          font-size: 1.5rem;
          text-align: center;
        }

        .error-message {
          background: #fee;
          color: #c33;
          padding: 0.75rem;
          border-radius: 4px;
          margin-bottom: 1rem;
          font-size: 0.9rem;
        }

        .form-group {
          margin-bottom: 1.25rem;
        }

        label {
          display: block;
          margin-bottom: 0.5rem;
          color: #555;
          font-weight: 500;
          font-size: 0.9rem;
        }

        input {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 1rem;
          transition: border-color 0.2s;
        }

        input:focus {
          outline: none;
          border-color: #0066cc;
        }

        input:disabled {
          background: #f5f5f5;
          cursor: not-allowed;
        }

        .forgot-password {
          text-align: right;
          margin-bottom: 1rem;
        }

        .link-button {
          background: none;
          border: none;
          color: #0066cc;
          font-size: 0.9rem;
          cursor: pointer;
          padding: 0;
          text-decoration: underline;
        }

        .link-button:hover {
          color: #0052a3;
        }

        .link-button:disabled {
          color: #999;
          cursor: not-allowed;
        }

        .submit-button {
          width: 100%;
          padding: 0.875rem;
          background: #0066cc;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .submit-button:hover:not(:disabled) {
          background: #0052a3;
        }

        .submit-button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
