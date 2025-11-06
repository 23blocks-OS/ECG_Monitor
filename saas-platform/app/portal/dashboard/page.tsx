'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/Card';
import { useAuth } from '@/components/AuthProvider';
import { apiClient } from '@/lib/api-client';
import { formatPrice, PLANS } from '@/lib/config';
import {
  Activity,
  Heart,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Package,
  CreditCard,
} from 'lucide-react';
import type { Customer, Subscription, Order, Device } from '@/types';

export default function DashboardPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const checkoutSuccess = searchParams.get('checkout') === 'success';

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user?.customerId) return;

    try {
      const [customerRes, subscriptionRes, ordersRes, devicesRes] = await Promise.all([
        apiClient.getCustomer(user.customerId),
        apiClient.getSubscription(user.customerId),
        apiClient.getOrders(user.customerId),
        apiClient.getDevices(user.customerId),
      ]);

      if (customerRes.success && customerRes.data) setCustomer(customerRes.data);
      if (subscriptionRes.success && subscriptionRes.data) setSubscription(subscriptionRes.data);
      if (ordersRes.success && ordersRes.data) setOrders(ordersRes.data);
      if (devicesRes.success && devicesRes.data) setDevices(devicesRes.data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const plan = customer ? PLANS[customer.plan] : null;

  return (
    <div>
      {/* Success Message */}
      {checkoutSuccess && (
        <Card className="mb-6 bg-green-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-green-900 mb-1">Order Successful!</h3>
                <p className="text-sm text-green-700">
                  Your payment was processed successfully. Your device will be assembled and
                  shipped within 3-5 business days. You'll receive tracking information via email.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {user?.name}!</h1>
        <p className="text-gray-600">Here's an overview of your ECG monitoring service</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Devices</p>
                <p className="text-3xl font-bold text-gray-900">
                  {devices.filter((d) => d.status === 'active').length}
                </p>
              </div>
              <Activity className="h-12 w-12 text-primary-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Subscription Status</p>
                <p className="text-xl font-semibold text-green-600">
                  {subscription?.status || 'N/A'}
                </p>
              </div>
              <Heart className="h-12 w-12 text-primary-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Monthly Cost</p>
                <p className="text-2xl font-bold text-gray-900">
                  {plan ? formatPrice(plan.price) : 'N/A'}
                </p>
              </div>
              <CreditCard className="h-12 w-12 text-primary-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending Orders</p>
                <p className="text-3xl font-bold text-gray-900">
                  {orders.filter((o) => o.status !== 'delivered').length}
                </p>
              </div>
              <Package className="h-12 w-12 text-primary-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Plan */}
      {plan && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Current Plan: {plan.name}</CardTitle>
            <CardDescription>{plan.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {formatPrice(plan.price)}/month
                </div>
                <p className="text-sm text-gray-600">
                  {subscription?.cancelAtPeriodEnd ? (
                    <span className="text-red-600">Cancels at period end</span>
                  ) : (
                    <>
                      Renews on{' '}
                      {subscription?.currentPeriodEnd
                        ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
                        : 'N/A'}
                    </>
                  )}
                </p>
              </div>
              <div>
                <Link href="/portal/billing">
                  <Button variant="outline">Manage Subscription</Button>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6 pt-6 border-t">
              <div>
                <p className="text-sm text-gray-600">Devices</p>
                <p className="font-semibold">
                  {devices.length} / {plan.maxDevices || '∞'}
                </p>
              </div>
              {plan.maxUsers && (
                <div>
                  <p className="text-sm text-gray-600">Users</p>
                  <p className="font-semibold">0 / {plan.maxUsers}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600">Infrastructure</p>
                <p className="font-semibold text-green-600">Deployed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Orders</CardTitle>
              <Link href="/portal/orders" className="text-sm text-primary-600 hover:underline">
                View all
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No orders yet</p>
            ) : (
              <div className="space-y-4">
                {orders.slice(0, 3).map((order) => (
                  <div
                    key={order.orderId}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">Order #{order.orderId.slice(0, 8)}</p>
                      <p className="text-sm text-gray-600">
                        {order.quantity} device(s) • {formatPrice(order.amount)}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        order.status === 'delivered'
                          ? 'bg-green-100 text-green-700'
                          : order.status === 'shipped'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Devices */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Your Devices</CardTitle>
              <Link href="/portal/devices" className="text-sm text-primary-600 hover:underline">
                View all
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {devices.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No devices registered yet</p>
            ) : (
              <div className="space-y-4">
                {devices.map((device) => (
                  <div
                    key={device.deviceId}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">{device.serialNumber}</p>
                      <p className="text-sm text-gray-600">
                        {device.lastSeenAt
                          ? `Last seen: ${new Date(device.lastSeenAt).toLocaleString()}`
                          : 'Never connected'}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        device.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {device.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="mt-8 bg-gradient-to-r from-primary-50 to-secondary-50 border-none">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Need help getting started?</h3>
              <p className="text-gray-600">
                Check our documentation or contact support for assistance
              </p>
            </div>
            <div className="flex space-x-4">
              <a
                href="https://github.com/23blocks-OS/ECG_Monitor"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline">View Docs</Button>
              </a>
              <a href="mailto:support@ecgmonitor.com">
                <Button>Contact Support</Button>
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
