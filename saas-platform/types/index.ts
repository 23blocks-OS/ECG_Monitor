/**
 * Type definitions for SaaS Platform
 */

export type PlanType = 'personal' | 'small_practice' | 'medium_practice' | 'enterprise';

export type OrderStatus = 'pending' | 'vendor_queue' | 'assembling' | 'assembled' | 'shipped' | 'delivered' | 'cancelled';

export type SubscriptionStatus = 'active' | 'past_due' | 'cancelled' | 'trialing';

export type DeviceStatus = 'provisioned' | 'shipped' | 'active' | 'inactive' | 'decommissioned';

export type CustomerStatus = 'active' | 'suspended' | 'cancelled';

export interface Plan {
  id: PlanType;
  name: string;
  description: string;
  price: number; // monthly price in cents
  devicePrice: number; // one-time device cost in cents
  stripePriceId?: string;
  features: string[];
  maxDevices?: number;
  maxUsers?: number;
  popular?: boolean;
}

export interface Customer {
  customerId: string;
  email: string;
  name: string;
  cognitoUserId: string;
  stripeCustomerId?: string;
  plan: PlanType;
  status: CustomerStatus;
  infraDeployed: boolean;
  organizationName?: string;
  phone?: string;
  address?: Address;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface Order {
  orderId: string;
  customerId: string;
  deviceType: string;
  quantity: number;
  amount: number; // in cents
  status: OrderStatus;
  trackingNumber?: string;
  vendorOrderId?: string;
  shippingAddress: Address;
  estimatedDelivery?: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export interface Subscription {
  subscriptionId: string;
  customerId: string;
  stripeSubscriptionId: string;
  plan: PlanType;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Device {
  deviceId: string;
  customerId: string;
  serialNumber: string;
  iotThingName: string;
  iotCertificateArn?: string;
  status: DeviceStatus;
  activatedAt?: string;
  lastSeenAt?: string;
  firmwareVersion?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface VendorOrder {
  vendorOrderId: string;
  orderId: string;
  customerId: string;
  deviceSpecs: {
    type: string;
    quantity: number;
    serialNumbers?: string[];
  };
  shippingAddress: Address;
  status: 'pending' | 'in_assembly' | 'assembled' | 'shipped';
  estimatedCompletion?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CheckoutSession {
  sessionId: string;
  customerId: string;
  plan: PlanType;
  deviceQuantity: number;
  totalAmount: number;
  status: 'pending' | 'completed' | 'expired';
  stripeCheckoutSessionId?: string;
  createdAt: string;
  expiresAt: string;
}

export interface InfrastructureStatus {
  customerId: string;
  deployed: boolean;
  status: 'pending' | 'deploying' | 'deployed' | 'failed' | 'deprovisioning';
  resources?: {
    iotThing?: string;
    dynamodbTable?: string;
    s3Bucket?: string;
    lambdaFunctions?: string[];
  };
  deploymentDate?: string;
  lastUpdated: string;
  errorMessage?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
  };
}
