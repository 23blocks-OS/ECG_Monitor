/**
 * Sign Up Form Component
 *
 * Handles user registration with email verification.
 * Supports custom attributes (organization_id, role).
 *
 * Usage:
 *   <SignUpForm
 *     onSuccess={() => setShowVerification(true)}
 *     organizationId="org-123"
 *     role="clinician"
 *   />
 */

'use client';

import React, { useState } from 'react';
import { useAuth } from './AuthProvider';
import { authHelpers } from '@/lib/auth';

interface SignUpFormProps {
  onSuccess?: (email: string) => void;
  organizationId?: string;
  role?: string;
  showVerification?: boolean;
  className?: string;
}

export function SignUpForm({
  onSuccess,
  organizationId,
  role,
  showVerification: initialShowVerification = false,
  className = '',
}: SignUpFormProps) {
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showVerification, setShowVerification] = useState(initialShowVerification);
  const [registeredEmail, setRegisteredEmail] = useState('');

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 12) {
      return 'Password must be at least 12 characters long';
    }
    if (!/[a-z]/.test(pwd)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[A-Z]/.test(pwd)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[0-9]/.test(pwd)) {
      return 'Password must contain at least one number';
    }
    if (!/[^a-zA-Z0-9]/.test(pwd)) {
      return 'Password must contain at least one special character';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setLoading(true);

    try {
      const result = await signUp(email, password, name, organizationId, role);

      if (result.success) {
        setRegisteredEmail(email);
        setShowVerification(true);
        if (onSuccess) {
          onSuccess(email);
        }
      } else {
        const errorMessage = getErrorMessage(result.error);
        setError(errorMessage);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await authHelpers.confirmSignUp(registeredEmail, verificationCode);

      if (result.success) {
        // Verification successful - user can now sign in
        if (onSuccess) {
          onSuccess(registeredEmail);
        }
      } else {
        const errorMessage = getErrorMessage(result.error);
        setError(errorMessage);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError('');
    setLoading(true);

    try {
      const result = await authHelpers.resendConfirmationCode(registeredEmail);

      if (result.success) {
        setError('Verification code resent! Check your email.');
      } else {
        const errorMessage = getErrorMessage(result.error);
        setError(errorMessage);
      }
    } catch (err) {
      setError('Failed to resend code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getErrorMessage = (error: any): string => {
    if (!error) return 'Operation failed. Please try again.';

    const errorCode = error.code || error.name;

    switch (errorCode) {
      case 'UsernameExistsException':
        return 'An account with this email already exists.';
      case 'InvalidPasswordException':
        return 'Password does not meet requirements.';
      case 'InvalidParameterException':
        return 'Invalid input. Please check your information.';
      case 'CodeMismatchException':
        return 'Invalid verification code. Please try again.';
      case 'ExpiredCodeException':
        return 'Verification code expired. Please request a new one.';
      case 'LimitExceededException':
        return 'Too many attempts. Please try again later.';
      default:
        return error.message || 'Operation failed. Please try again.';
    }
  };

  if (showVerification) {
    return (
      <div className={`signup-form ${className}`}>
        <form onSubmit={handleVerificationSubmit}>
          <h2>Verify Your Email</h2>
          <p className="info-text">
            We sent a verification code to <strong>{registeredEmail}</strong>
          </p>

          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="verification-code">Verification Code</label>
            <input
              id="verification-code"
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="123456"
              required
              disabled={loading}
              autoComplete="off"
            />
          </div>

          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>

          <div className="resend-section">
            <p>Didn't receive the code?</p>
            <button
              type="button"
              onClick={handleResendCode}
              className="link-button"
              disabled={loading}
            >
              Resend Code
            </button>
          </div>
        </form>
        {renderStyles()}
      </div>
    );
  }

  return (
    <div className={`signup-form ${className}`}>
      <form onSubmit={handleSubmit}>
        <h2>Create Account</h2>

        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="name">Full Name</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            required
            disabled={loading}
            autoComplete="name"
          />
        </div>

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
            placeholder="••••••••••••"
            required
            disabled={loading}
            autoComplete="new-password"
          />
          <small className="help-text">
            Must be 12+ characters with uppercase, lowercase, number, and special character
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="confirm-password">Confirm Password</label>
          <input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••••••"
            required
            disabled={loading}
            autoComplete="new-password"
          />
        </div>

        <button type="submit" className="submit-button" disabled={loading}>
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>
      {renderStyles()}
    </div>
  );
}

function renderStyles() {
  return (
    <style jsx>{`
      .signup-form {
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

      .info-text {
        text-align: center;
        color: #666;
        margin-bottom: 1.5rem;
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

      .help-text {
        display: block;
        margin-top: 0.25rem;
        color: #888;
        font-size: 0.8rem;
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

      .resend-section {
        text-align: center;
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid #eee;
      }

      .resend-section p {
        margin: 0 0 0.5rem 0;
        color: #666;
        font-size: 0.9rem;
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
    `}</style>
  );
}
