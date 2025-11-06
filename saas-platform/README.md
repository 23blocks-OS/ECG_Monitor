# ECG Monitor SaaS Platform

> Customer-facing e-commerce and subscription platform for ECG Monitor devices

## Overview

The SaaS Platform is a complete e-commerce and subscription management system that allows non-technical customers to:
- Purchase pre-configured ECG monitoring devices
- Subscribe to monthly cloud monitoring services
- Manage their account, billing, and devices through a web portal
- Receive fully managed infrastructure with zero technical setup

## Architecture

### Frontend (Next.js)
- **Landing Page**: Product features, benefits, and CTA
- **Pricing Page**: Plan comparison and feature matrix
- **Signup/Login**: AWS Cognito authentication
- **Checkout**: Stripe integration for payments
- **Customer Portal**: Dashboard, billing, orders, devices, settings

### Backend (AWS Lambda)
- **Customer Management**: CRUD operations for customer data
- **Order Processing**: Device orders and vendor integration
- **Subscription Management**: Stripe webhooks and subscription lifecycle
- **Device Provisioning**: IoT certificate generation and registration
- **Infrastructure Provisioning**: Automated AWS resource deployment per customer

### Database (DynamoDB)
- **customers**: Customer profiles and metadata
- **orders**: Device orders and shipping tracking
- **subscriptions**: Billing and subscription status
- **devices**: Device inventory and connectivity status
- **vendor_orders**: Orders sent to assembly partner in Colombia

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, React, Tailwind CSS
- **Authentication**: AWS Cognito
- **Payments**: Stripe (Checkout, Customer Portal, Webhooks)
- **Backend**: AWS Lambda, API Gateway, Node.js/TypeScript
- **Database**: DynamoDB
- **Infrastructure**: Terraform
- **Cloud**: AWS (IoT Core, S3, CloudWatch, SES)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- AWS CLI configured with credentials
- Terraform 1.0+
- Stripe account (test mode for development)

### 1. Install Dependencies

```bash
cd saas-platform
npm install
```

### 2. Configure Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.local.example .env.local
```

Required environment variables:

```bash
# AWS Cognito (from your Terraform deployment)
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
NEXT_PUBLIC_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx

# Stripe (from your Stripe dashboard)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# API Endpoint (will be your API Gateway URL after deployment)
NEXT_PUBLIC_API_ENDPOINT=https://api.ecgmonitor.com/v1

# Application URLs
NEXT_PUBLIC_APP_URL=http://localhost:3001
NEXT_PUBLIC_DASHBOARD_URL=http://localhost:3000
```

### 3. Deploy Infrastructure

Deploy the DynamoDB tables:

```bash
cd terraform/modules/saas-backend
terraform init
terraform apply
```

### 4. Deploy Lambda Functions

```bash
cd lambda/saas-backend
npm install
npm run build

# Deploy using AWS SAM or Serverless Framework
# (Deployment scripts to be added)
```

### 5. Run Development Server

```bash
cd saas-platform
npm run dev
```

Visit http://localhost:3001

## Deployment

### Production Deployment

1. **Deploy Infrastructure**:
   ```bash
   terraform apply -var="environment=prod"
   ```

2. **Deploy Backend**:
   ```bash
   cd lambda/saas-backend
   ./deploy.sh prod
   ```

3. **Build and Deploy Frontend**:
   ```bash
   cd saas-platform
   npm run build
   # Deploy to Vercel, AWS Amplify, or your preferred hosting
   ```

4. **Configure Stripe Webhooks**:
   - Go to Stripe Dashboard → Developers → Webhooks
   - Add endpoint: `https://api.yourdomain.com/webhooks/stripe`
   - Subscribe to events:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`

## Customer Journey

### 1. Sign Up & Select Plan
Customer visits the website, browses pricing, and signs up:
- Personal Plan: $29/month + $99 device
- Small Practice: $99/month + $99/device (up to 5)
- Medium Practice: $249/month + $89/device (up to 20)
- Enterprise: Custom pricing

### 2. Checkout
- Enter shipping address
- Stripe Checkout for payment
- 30-day free trial (first month free)

### 3. Order Processing
- Order created in DynamoDB
- Vendor order sent to Colombia assembly partner
- Device assembled and shipped (3-5 business days assembly + 5-7 days shipping)

### 4. Device Provisioning
- IoT certificates generated
- Device pre-configured with customer's credentials
- Infrastructure deployed in customer's isolated AWS environment

### 5. Delivery & Activation
- Customer receives device
- Plugs in → auto-connects
- Starts monitoring immediately

### 6. Ongoing Management
- Customer portal for billing, orders, and devices
- Monthly subscription auto-renewed via Stripe
- Support via email or phone (depending on plan)

## Vendor Integration

### Colombia Assembly Partner

**Order Flow**:
1. Customer completes checkout
2. Order created in `orders` table
3. Vendor order created in `vendor_orders` table
4. Webhook/email sent to vendor with:
   - Customer shipping address
   - Device specifications
   - Serial numbers to provision
   - Special instructions

**Status Updates**:
- Vendor updates order status via API or admin portal:
  - `pending` → `in_assembly` → `assembled` → `shipped`
- Tracking number added when shipped
- Customer notified via email

**API Endpoints for Vendor**:
- `POST /vendor/orders/{vendorOrderId}/status` - Update order status
- `POST /vendor/orders/{vendorOrderId}/tracking` - Add tracking number
- `GET /vendor/orders/pending` - Get pending orders

## Admin Portal

The admin portal (to be built) provides:
- **Customer Management**: View all customers, subscriptions, and status
- **Order Management**: Track all orders, update status, view shipping
- **Vendor Queue**: Manage orders pending assembly
- **Infrastructure Monitoring**: View AWS resource costs per customer
- **Support Dashboard**: Handle support tickets and billing issues

## Stripe Integration

### Products
- **Device Hardware**: One-time payment
- **Monthly Subscription**: Recurring monthly charge

### Webhooks Handled
- `checkout.session.completed`: Create order and subscription
- `customer.subscription.created`: Initialize subscription record
- `customer.subscription.updated`: Update subscription status
- `customer.subscription.deleted`: Handle cancellation
- `invoice.payment_succeeded`: Update payment status
- `invoice.payment_failed`: Notify customer of failed payment

## Security

- **Authentication**: AWS Cognito with MFA support
- **API Authorization**: JWT tokens from Cognito
- **Data Encryption**: TLS 1.3 in transit, AES-256 at rest
- **Payment Security**: PCI-DSS compliant via Stripe
- **HIPAA Compliance**: BAA available for covered entities
- **Multi-Tenancy**: Isolated AWS resources per customer

## Cost Breakdown

### Per Customer Operating Costs
- **AWS Infrastructure**: $25-45/month (IoT, Lambda, DynamoDB, S3)
- **Claude API**: $15-30/month (for AI analysis)
- **Bandwidth**: $5-10/month
- **Total**: ~$45-85/month per active customer

### Profitability
- **Personal Plan**: $29/month (break-even to small profit)
- **Small Practice**: $99/month (healthy margin with 5 devices)
- **Medium Practice**: $249/month (excellent margin with 20 devices)

## Monitoring & Operations

### Key Metrics to Track
- Monthly Recurring Revenue (MRR)
- Customer Acquisition Cost (CAC)
- Churn rate
- Device utilization
- Infrastructure costs per customer
- Support ticket volume

### Alerts
- Failed payments
- Device connectivity issues
- Infrastructure provisioning failures
- High infrastructure costs

## Future Enhancements

### Phase 1 (MVP - Current)
- [x] Customer signup and authentication
- [x] Stripe checkout integration
- [x] Order management
- [x] Basic customer portal
- [ ] Vendor integration API
- [ ] Admin portal

### Phase 2
- [ ] Advanced analytics dashboard
- [ ] Multi-user accounts (for practices)
- [ ] Role-based access control
- [ ] Mobile app integration
- [ ] EHR/EMR integrations (FHIR)

### Phase 3
- [ ] White-label options for enterprises
- [ ] Custom branding
- [ ] Advanced compliance features
- [ ] Automated infrastructure scaling
- [ ] Predictive cost optimization

## Support

- **Documentation**: https://github.com/23blocks-OS/ECG_Monitor
- **Email**: support@ecgmonitor.com
- **Sales**: sales@ecgmonitor.com

## License

Same as main ECG Monitor project - free for medical institutions, non-profits, and personal use. Commercial license required for for-profit use.

## Contributing

Contributions welcome! Please see main project README for guidelines.

---

Created by Juan Pelaez as part of the ECG Monitor project.
