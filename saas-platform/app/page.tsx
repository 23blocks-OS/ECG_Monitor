'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import {
  Heart, Brain, Cloud, Activity, Lock, DollarSign,
  Smartphone, Zap, Shield, TrendingUp, Users, CheckCircle
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-secondary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="text-center animate-fadeIn">
            <div className="inline-block mb-4">
              <span className="px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-semibold">
                🎉 Fully Managed ECG Monitoring Service
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              AI-Powered ECG Monitoring
              <br />
              <span className="gradient-text">Delivered to Your Door</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Purchase a pre-configured ECG device and subscribe to our cloud monitoring service.
              No technical knowledge required. Plug in and start monitoring in minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button size="lg" className="px-8">
                  Get Started Now
                </Button>
              </Link>
              <Link href="/pricing">
                <Button variant="outline" size="lg" className="px-8">
                  View Pricing
                </Button>
              </Link>
            </div>
            <p className="text-sm text-gray-500 mt-6">
              From $29/month + $99 device • 30-day free trial • Cancel anytime
            </p>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-primary-200 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-secondary-200 rounded-full opacity-20 blur-3xl"></div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need for Heart Monitoring
            </h2>
            <p className="text-xl text-gray-600">
              Professional-grade ECG monitoring made simple
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="card-hover" padding>
              <Brain className="h-12 w-12 text-primary-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">AI-Powered Analysis</h3>
              <p className="text-gray-600">
                Claude 3.5 Sonnet detects arrhythmias and patterns that consumer devices miss
              </p>
            </Card>

            <Card className="card-hover" padding>
              <Activity className="h-12 w-12 text-primary-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Medical-Grade Quality</h3>
              <p className="text-gray-600">
                3-lead ECG at 250-500 Hz sampling rate with professional signal processing
              </p>
            </Card>

            <Card className="card-hover" padding>
              <Cloud className="h-12 w-12 text-primary-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Cloud Infrastructure</h3>
              <p className="text-gray-600">
                AWS serverless architecture for scalable, reliable data processing
              </p>
            </Card>

            <Card className="card-hover" padding>
              <Smartphone className="h-12 w-12 text-primary-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Real-Time Dashboards</h3>
              <p className="text-gray-600">
                Web and mobile apps with live ECG visualization and insights
              </p>
            </Card>

            <Card className="card-hover" padding>
              <Lock className="h-12 w-12 text-primary-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Secure & Private</h3>
              <p className="text-gray-600">
                Your data in your own isolated AWS environment with full encryption
              </p>
            </Card>

            <Card className="card-hover" padding>
              <DollarSign className="h-12 w-12 text-primary-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Affordable</h3>
              <p className="text-gray-600">
                Starting at $29/month with $99 one-time device cost. No hidden fees
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              From order to monitoring in 5 simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            {[
              {
                step: 1,
                title: 'Sign Up & Choose Plan',
                description: 'Select the plan that fits your needs',
                icon: Users,
              },
              {
                step: 2,
                title: 'Device Ships',
                description: 'Pre-configured device shipped to your door',
                icon: Heart,
              },
              {
                step: 3,
                title: 'Plug & Connect',
                description: 'Device auto-connects on first power-on',
                icon: Zap,
              },
              {
                step: 4,
                title: 'Start Monitoring',
                description: 'Apply electrodes and view real-time data',
                icon: Activity,
              },
              {
                step: 5,
                title: 'Get AI Insights',
                description: 'Receive alerts and AI-powered analysis',
                icon: Brain,
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="relative mb-4">
                  <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto">
                    <item.icon className="h-8 w-8 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-secondary-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {item.step}
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Why Choose Our Managed Service?
              </h2>
              <div className="space-y-4">
                {[
                  'No technical setup required - we handle everything',
                  'Pre-configured devices ready out of the box',
                  'Automatic software updates',
                  'Dedicated technical support',
                  '99.5% uptime SLA guarantee',
                  'HIPAA-compliant infrastructure',
                  'Device shipping included',
                  '30-day money-back guarantee',
                ].map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <Card className="bg-gradient-to-br from-primary-50 to-secondary-50 border-none shadow-lg">
              <div className="p-8">
                <Shield className="h-16 w-16 text-primary-600 mb-4" />
                <h3 className="text-2xl font-bold mb-4">Enterprise-Grade Security</h3>
                <p className="text-gray-700 mb-6">
                  Your health data is stored in isolated AWS infrastructure with:
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                    <span>End-to-end encryption</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                    <span>TLS 1.3 for data in transit</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                    <span>AES-256 encryption at rest</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                    <span>Regular security audits</span>
                  </li>
                </ul>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-secondary-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Start Monitoring Your Heart Health?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join hundreds of individuals and healthcare practices using ECG Monitor
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" variant="secondary" className="bg-white text-primary-600 hover:bg-gray-100 px-8">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 px-8">
                View Pricing Plans
              </Button>
            </Link>
          </div>
          <p className="text-sm text-white/80 mt-6">
            30-day free trial • No credit card required to start • Cancel anytime
          </p>
        </div>
      </section>

      {/* Safety Disclaimer */}
      <section className="py-8 bg-yellow-50 border-t border-yellow-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-start space-x-3">
            <Shield className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">⚠️ Important Safety Notice</h3>
              <p className="text-sm text-gray-700">
                This is a research project, not a medical device. It is NOT intended for clinical diagnosis or treatment
                and is NOT FDA approved or CE marked. Always consult healthcare professionals for medical decisions. Use at your own risk.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
