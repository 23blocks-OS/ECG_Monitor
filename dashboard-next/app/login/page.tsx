/**
 * Login Page
 *
 * Authentication page for existing users.
 * Redirects to dashboard on successful login.
 */

'use client';

import { useRouter } from 'next/navigation';
import { LoginForm } from '@/components/Auth';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push('/dashboard');
  };

  const handleForgotPassword = () => {
    // TODO: Implement forgot password flow
    alert('Forgot password flow coming soon!');
  };

  return (
    <div className="login-page">
      <div className="container">
        <div className="header">
          <h1>ECG Monitor</h1>
          <p>Real-time cardiac monitoring with AI-powered analysis</p>
        </div>

        <LoginForm onSuccess={handleSuccess} onForgotPassword={handleForgotPassword} />

        <div className="footer">
          <p>
            Don't have an account?{' '}
            <Link href="/signup" className="link">
              Sign up
            </Link>
          </p>
        </div>
      </div>

      <style jsx>{`
        .login-page {
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
