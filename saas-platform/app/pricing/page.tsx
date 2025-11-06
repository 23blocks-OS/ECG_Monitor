'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { PLANS, formatPrice } from '@/lib/config';
import { Check, X } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';

export default function PricingPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
    if (planId === 'enterprise') {
      // Redirect to contact form for enterprise
      window.location.href = 'mailto:sales@ecgmonitor.com?subject=Enterprise Plan Inquiry';
      return;
    }

    if (isAuthenticated) {
      router.push(`/checkout?plan=${planId}`);
    } else {
      router.push(`/signup?plan=${planId}`);
    }
  };

  const plans = [
    PLANS.personal,
    PLANS.small_practice,
    PLANS.medium_practice,
    PLANS.enterprise,
  ];

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Choose the plan that fits your needs
          </p>
          <p className="text-sm text-gray-500">
            All plans include 30-day free trial • Cancel anytime • No hidden fees
          </p>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative ${
                plan.popular ? 'ring-2 ring-primary-500 shadow-xl' : ''
              }`}
              padding
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-primary-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-sm text-gray-600 mb-4">{plan.description}</p>

                {plan.id === 'enterprise' ? (
                  <div className="text-3xl font-bold text-gray-900">Custom Pricing</div>
                ) : (
                  <>
                    <div className="mb-2">
                      <span className="text-4xl font-bold text-gray-900">
                        {formatPrice(plan.price)}
                      </span>
                      <span className="text-gray-600">/month</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      Device: {formatPrice(plan.devicePrice)} one-time
                    </div>
                  </>
                )}
              </div>

              <Button
                className="w-full mb-6"
                variant={plan.popular ? 'primary' : 'outline'}
                onClick={() => handleSelectPlan(plan.id)}
                isLoading={selectedPlan === plan.id}
              >
                {plan.id === 'enterprise' ? 'Contact Sales' : 'Get Started'}
              </Button>

              <div className="space-y-3">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>

              {plan.maxDevices && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    <div className="flex justify-between mb-1">
                      <span>Max Devices:</span>
                      <span className="font-semibold">{plan.maxDevices}</span>
                    </div>
                    {plan.maxUsers && (
                      <div className="flex justify-between">
                        <span>Max Users:</span>
                        <span className="font-semibold">{plan.maxUsers}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* Comparison Table */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Detailed Feature Comparison
        </h2>

        <Card padding={false}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Feature
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                    Personal
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                    Small Practice
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                    Medium Practice
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                    Enterprise
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {[
                  { name: 'Devices', values: ['1', '5', '20', 'Unlimited'] },
                  { name: 'Users', values: ['1', '10', '50', 'Unlimited'] },
                  { name: 'AI Analysis', values: [true, true, true, true] },
                  { name: 'Real-time Alerts', values: [true, true, true, true] },
                  { name: 'Web Dashboard', values: [true, true, true, true] },
                  { name: 'Mobile App', values: [true, true, true, true] },
                  { name: 'Data Export', values: [true, true, true, true] },
                  { name: 'Email Support', values: [true, true, true, true] },
                  { name: 'Phone Support', values: [false, false, true, true] },
                  { name: '24/7 Support', values: [false, false, false, true] },
                  { name: 'Custom Integrations', values: [false, false, true, true] },
                  { name: 'White Label', values: [false, false, false, true] },
                  { name: 'Dedicated Manager', values: [false, false, false, true] },
                  { name: 'Custom SLA', values: [false, false, false, true] },
                ].map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{row.name}</td>
                    {row.values.map((value, i) => (
                      <td key={i} className="px-6 py-4 text-center">
                        {typeof value === 'boolean' ? (
                          value ? (
                            <Check className="h-5 w-5 text-green-500 mx-auto" />
                          ) : (
                            <X className="h-5 w-5 text-gray-300 mx-auto" />
                          )
                        ) : (
                          <span className="text-sm text-gray-700">{value}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* FAQ */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Frequently Asked Questions
        </h2>

        <div className="space-y-6">
          {[
            {
              q: 'Can I try before I buy?',
              a: 'Yes! All plans include a 30-day free trial. You only pay the device cost upfront, which is refundable if you cancel within 30 days.',
            },
            {
              q: 'What happens if I cancel my subscription?',
              a: 'You can cancel anytime. Your service continues until the end of the billing period. The device is yours to keep, but it will stop connecting to our service.',
            },
            {
              q: 'Can I upgrade or downgrade my plan?',
              a: 'Yes, you can change plans at any time. Upgrades take effect immediately. Downgrades take effect at the next billing cycle.',
            },
            {
              q: 'Do I own the hardware?',
              a: 'Yes, you own the device after purchase. If you cancel your subscription, you keep the device but it will no longer connect to our service.',
            },
            {
              q: 'How long does shipping take?',
              a: 'Devices are assembled in Colombia and typically ship within 3-5 business days. Delivery takes 5-7 business days to most locations.',
            },
            {
              q: 'Is this HIPAA compliant?',
              a: 'Yes, our infrastructure is HIPAA-compliant. We provide Business Associate Agreements (BAA) for covered entities upon request.',
            },
            {
              q: 'Can I export my data?',
              a: 'Yes, all plans include data export in CSV and JSON formats. You own your data and can export it at any time.',
            },
            {
              q: 'What kind of support do you offer?',
              a: 'All plans include email support. Medium Practice and Enterprise plans include phone support. Enterprise gets 24/7 support.',
            },
          ].map((faq, index) => (
            <Card key={index} padding>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{faq.q}</h3>
              <p className="text-gray-600">{faq.a}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <Card className="bg-gradient-to-r from-primary-600 to-secondary-600 border-none">
          <div className="p-8 text-white">
            <h2 className="text-3xl font-bold mb-4">Still Have Questions?</h2>
            <p className="text-lg mb-6 text-white/90">
              Our team is here to help you choose the right plan
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="mailto:sales@ecgmonitor.com">
                <Button
                  size="lg"
                  variant="secondary"
                  className="bg-white text-primary-600 hover:bg-gray-100"
                >
                  Contact Sales
                </Button>
              </a>
              <Link href="/signup">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/10"
                >
                  Start Free Trial
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
