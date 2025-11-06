/**
 * Sign Up Page
 *
 * Registration page for new users.
 * Includes email verification flow.
 */

'use client';

import { useRouter } from 'next/navigation';
import { SignUpForm } from '@/components/Auth';
import Link from 'next/link';
import { useState } from 'react';

export default function SignUpPage() {
  const router = useRouter();
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const handleSuccess = (email: string) => {
    setShowSuccessMessage(true);
    // After successful verification, redirect to login
    setTimeout(() => {
      router.push('/login?verified=true');
    }, 2000);
  };

  if (showSuccessMessage) {
    return (
      <div className="signup-page">
        <div className="container">
          <div className="success-card">
            <div className="checkmark">✓</div>
            <h2>Account Verified!</h2>
            <p>Your email has been verified successfully.</p>
            <p>Redirecting to login...</p>
          </div>
        </div>

        <style jsx>{`
          .signup-page {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 2rem;
          }

          .container {
            max-width: 500px;
            width: 100%;
          }

          .success-card {
            background: white;
            padding: 3rem 2rem;
            border-radius: 8px;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
            text-align: center;
          }

          .checkmark {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: #28a745;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 3rem;
            margin: 0 auto 1.5rem;
            animation: scale-in 0.3s ease-out;
          }

          @keyframes scale-in {
            from {
              transform: scale(0);
            }
            to {
              transform: scale(1);
            }
          }

          h2 {
            margin: 0 0 1rem 0;
            color: #333;
          }

          p {
            margin: 0.5rem 0;
            color: #666;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="signup-page">
      <div className="container">
        <div className="header">
          <h1>ECG Monitor</h1>
          <p>Join the future of cardiac monitoring</p>
        </div>

        <SignUpForm onSuccess={handleSuccess} />

        <div className="footer">
          <p>
            Already have an account?{' '}
            <Link href="/login" className="link">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      <style jsx>{`
        .signup-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 2rem;
        }

        .container {
          max-width: 500px;
          width: 100%;
        }

        .header {
          text-align: center;
          margin-bottom: 2rem;
          color: white;
        }

        .header h1 {
          font-size: 2.5rem;
          margin: 0 0 0.5rem 0;
          font-weight: 700;
        }

        .header p {
          margin: 0;
          opacity: 0.9;
        }

        .footer {
          text-align: center;
          margin-top: 1.5rem;
          color: white;
        }

        .footer p {
          margin: 0;
        }

        .link {
          color: white;
          text-decoration: underline;
          font-weight: 600;
        }

        .link:hover {
          opacity: 0.8;
        }
      `}</style>
    </div>
  );
}
