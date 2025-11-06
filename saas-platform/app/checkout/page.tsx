'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/Button';
import { Input, Select } from '@/components/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/Card';
import { useAuth } from '@/components/AuthProvider';
import { PLANS, formatPrice, SHIPPING_COUNTRIES } from '@/lib/config';
import { apiClient } from '@/lib/api-client';
import { loadStripe } from '@stripe/stripe-js';
import { Heart, ShoppingCart, CreditCard, Truck } from 'lucide-react';
import type { Address } from '@/types';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, user } = useAuth();

  const planId = searchParams.get('plan') || 'personal';
  const plan = PLANS[planId as keyof typeof PLANS];

  const [deviceQuantity, setDeviceQuantity] = useState(1);
  const [shippingAddress, setShippingAddress] = useState<Address>({
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'US',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(`/signup?plan=${planId}`);
    }
  }, [isAuthenticated, planId, router]);

  const calculateTotal = () => {
    const deviceTotal = plan.devicePrice * deviceQuantity;
    const monthlyPrice = plan.price;
    return { deviceTotal, monthlyPrice, total: deviceTotal };
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Validate address
      if (!shippingAddress.line1 || !shippingAddress.city || !shippingAddress.postalCode) {
        setError('Please fill in all required address fields');
        setIsLoading(false);
        return;
      }

      // Create Stripe checkout session
      const result = await apiClient.createCheckoutSession({
        plan: planId,
        deviceQuantity,
        successUrl: `${window.location.origin}/portal/dashboard?checkout=success`,
        cancelUrl: `${window.location.origin}/checkout?plan=${planId}`,
      });

      if (result.success && result.data) {
        const stripe = await stripePromise;
        if (stripe) {
          // Redirect to Stripe Checkout
          await stripe.redirectToCheckout({ sessionId: result.data.sessionId });
        }
      } else {
        setError(result.error?.message || 'Failed to create checkout session');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during checkout');
    } finally {
      setIsLoading(false);
    }
  };

  const { deviceTotal, monthlyPrice, total } = calculateTotal();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <Heart className="h-12 w-12 text-primary-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Order</h1>
          <p className="text-gray-600">You're one step away from monitoring your heart health</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div>
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <ShoppingCart className="h-5 w-5 text-primary-600" />
                  <CardTitle>Order Summary</CardTitle>
                </div>
                <CardDescription>Review your selected plan and devices</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Plan Details */}
                  <div className="border-b pb-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">{plan.name}</h3>
                        <p className="text-sm text-gray-600">{plan.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">
                          {formatPrice(monthlyPrice)}/mo
                        </div>
                      </div>
                    </div>
                    <ul className="text-sm text-gray-600 space-y-1 mt-2">
                      {plan.features.slice(0, 4).map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-green-500 mr-2">✓</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Device Selection */}
                  <div className="border-b pb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Devices
                    </label>
                    <div className="flex items-center space-x-4">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setDeviceQuantity(Math.max(1, deviceQuantity - 1))}
                        disabled={deviceQuantity <= 1}
                      >
                        -
                      </Button>
                      <span className="text-lg font-semibold w-12 text-center">
                        {deviceQuantity}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setDeviceQuantity(
                            Math.min(plan.maxDevices || 999, deviceQuantity + 1)
                          )
                        }
                        disabled={deviceQuantity >= (plan.maxDevices || 999)}
                      >
                        +
                      </Button>
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      {formatPrice(plan.devicePrice)} × {deviceQuantity} ={' '}
                      {formatPrice(deviceTotal)}
                    </div>
                  </div>

                  {/* Total */}
                  <div className="bg-primary-50 rounded-lg p-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Device(s) (one-time)</span>
                        <span className="font-medium">{formatPrice(deviceTotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Monthly subscription</span>
                        <span className="font-medium">{formatPrice(monthlyPrice)}/mo</span>
                      </div>
                      <div className="border-t border-primary-200 pt-2 flex justify-between">
                        <span className="font-bold text-gray-900">Due Today</span>
                        <span className="font-bold text-primary-600 text-xl">
                          {formatPrice(total)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">
                        First month is free. You'll be charged {formatPrice(monthlyPrice)}/month
                        starting 30 days from today.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Shipping Form */}
          <div>
            <form onSubmit={handleCheckout}>
              <Card className="mb-6">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Truck className="h-5 w-5 text-primary-600" />
                    <CardTitle>Shipping Address</CardTitle>
                  </div>
                  <CardDescription>Where should we send your device(s)?</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    label="Street Address"
                    placeholder="123 Main St"
                    value={shippingAddress.line1}
                    onChange={(e) =>
                      setShippingAddress({ ...shippingAddress, line1: e.target.value })
                    }
                    required
                  />

                  <Input
                    label="Apartment, suite, etc. (optional)"
                    placeholder="Apt 4B"
                    value={shippingAddress.line2}
                    onChange={(e) =>
                      setShippingAddress({ ...shippingAddress, line2: e.target.value })
                    }
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="City"
                      placeholder="New York"
                      value={shippingAddress.city}
                      onChange={(e) =>
                        setShippingAddress({ ...shippingAddress, city: e.target.value })
                      }
                      required
                    />

                    <Input
                      label="State/Province"
                      placeholder="NY"
                      value={shippingAddress.state}
                      onChange={(e) =>
                        setShippingAddress({ ...shippingAddress, state: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Postal Code"
                      placeholder="10001"
                      value={shippingAddress.postalCode}
                      onChange={(e) =>
                        setShippingAddress({ ...shippingAddress, postalCode: e.target.value })
                      }
                      required
                    />

                    <Select
                      label="Country"
                      options={SHIPPING_COUNTRIES.map((c) => ({
                        value: c.code,
                        label: c.name,
                      }))}
                      value={shippingAddress.country}
                      onChange={(e) =>
                        setShippingAddress({ ...shippingAddress, country: e.target.value })
                      }
                      required
                    />
                  </div>
                </CardContent>
              </Card>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <Card className="bg-gradient-to-r from-primary-600 to-secondary-600 border-none text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <CreditCard className="h-5 w-5" />
                      <span className="font-semibold">Secure Payment</span>
                    </div>
                    <div className="text-sm opacity-90">Powered by Stripe</div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-white text-primary-600 hover:bg-gray-100"
                    size="lg"
                    isLoading={isLoading}
                  >
                    Proceed to Payment
                  </Button>
                  <p className="text-xs opacity-90 text-center mt-3">
                    Your payment information is encrypted and secure
                  </p>
                </CardContent>
              </Card>

              <p className="text-sm text-gray-600 text-center mt-6">
                30-day money-back guarantee • Cancel anytime • No hidden fees
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
