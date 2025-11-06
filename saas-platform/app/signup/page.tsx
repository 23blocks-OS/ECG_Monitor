'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/Card';
import { useAuth } from '@/components/AuthProvider';
import { Heart, AlertCircle } from 'lucide-react';

export default function SignUpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signUp, confirmSignUp, isAuthenticated } = useAuth();

  const [step, setStep] = useState<'signup' | 'verify'>('signup');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [verificationCode, setVerificationCode] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const plan = searchParams.get('plan');

  useEffect(() => {
    if (isAuthenticated) {
      if (plan) {
        router.push(`/checkout?plan=${plan}`);
      } else {
        router.push('/portal/dashboard');
      }
    }
  }, [isAuthenticated, plan, router]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await signUp(
        formData.email,
        formData.password,
        formData.name,
        formData.phone || undefined
      );

      if (result.success) {
        setStep('verify');
      } else {
        setError(result.error?.message || 'Sign up failed. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!verificationCode.trim()) {
      setError('Please enter the verification code');
      return;
    }

    setIsLoading(true);

    try {
      const result = await confirmSignUp(formData.email, verificationCode);

      if (result.success) {
        // After confirmation, redirect to login or auto-login
        router.push(`/login?email=${encodeURIComponent(formData.email)}`);
      } else {
        setError(result.error?.message || 'Verification failed. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-12">
      <div className="max-w-md mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 mb-6">
            <Heart className="h-10 w-10 text-primary-600" />
            <span className="text-2xl font-bold text-gray-900">ECG Monitor</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {step === 'signup' ? 'Create Your Account' : 'Verify Your Email'}
          </h1>
          <p className="text-gray-600">
            {step === 'signup'
              ? plan
                ? 'Sign up to purchase your device and subscription'
                : 'Start monitoring your heart health today'
              : 'We sent a verification code to your email'}
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {step === 'signup' ? (
              <form onSubmit={handleSignUp} className="space-y-4">
                <Input
                  type="text"
                  name="name"
                  label="Full Name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  error={errors.name}
                  required
                />

                <Input
                  type="email"
                  name="email"
                  label="Email Address"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  error={errors.email}
                  required
                />

                <Input
                  type="tel"
                  name="phone"
                  label="Phone Number (Optional)"
                  placeholder="+1 (555) 123-4567"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />

                <Input
                  type="password"
                  name="password"
                  label="Password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  error={errors.password}
                  helperText="At least 8 characters with uppercase, lowercase, and number"
                  required
                />

                <Input
                  type="password"
                  name="confirmPassword"
                  label="Confirm Password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, confirmPassword: e.target.value })
                  }
                  error={errors.confirmPassword}
                  required
                />

                <Button type="submit" className="w-full" isLoading={isLoading}>
                  Create Account
                </Button>

                <p className="text-sm text-gray-600 text-center">
                  By signing up, you agree to our{' '}
                  <Link href="/terms" className="text-primary-600 hover:underline">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-primary-600 hover:underline">
                    Privacy Policy
                  </Link>
                </p>
              </form>
            ) : (
              <form onSubmit={handleVerify} className="space-y-4">
                <div className="text-center mb-6">
                  <p className="text-sm text-gray-600 mb-2">
                    We sent a 6-digit code to:
                  </p>
                  <p className="font-semibold text-gray-900">{formData.email}</p>
                </div>

                <Input
                  type="text"
                  name="code"
                  label="Verification Code"
                  placeholder="123456"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  required
                  maxLength={6}
                />

                <Button type="submit" className="w-full" isLoading={isLoading}>
                  Verify Email
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    className="text-sm text-primary-600 hover:underline"
                    onClick={() => {
                      // Implement resend code
                      alert('Resend code functionality to be implemented');
                    }}
                  >
                    Didn't receive the code? Resend
                  </button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-sm text-gray-600 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-primary-600 hover:underline font-semibold">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
