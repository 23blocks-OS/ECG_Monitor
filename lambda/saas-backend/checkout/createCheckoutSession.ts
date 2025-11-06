/**
 * Create Stripe Checkout Session
 * POST /checkout/create-session
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import Stripe from 'stripe';
import { v4 as uuidv4 } from 'uuid';
import { DB, TABLES } from '../shared/db';
import type { ApiResponse } from '../shared/types';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

const PLANS_PRICING = {
  personal: { monthlyPrice: 2900, devicePrice: 9900 },
  small_practice: { monthlyPrice: 9900, devicePrice: 8900 },
  medium_practice: { monthlyPrice: 24900, devicePrice: 8900 },
  enterprise: { monthlyPrice: 0, devicePrice: 0 }, // Custom pricing
};

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { plan, deviceQuantity, successUrl, cancelUrl } = body;

    // Get customer from JWT token (you'd extract this from Authorization header)
    const customerId = event.requestContext.authorizer?.claims?.sub;

    if (!customerId || !plan || !deviceQuantity) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          success: false,
          error: {
            code: 'MISSING_PARAMETERS',
            message: 'Missing required parameters',
          },
        } as ApiResponse),
      };
    }

    // Get customer details
    const customer = await DB.get(TABLES.CUSTOMERS, { customerId });

    if (!customer) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          success: false,
          error: {
            code: 'CUSTOMER_NOT_FOUND',
            message: 'Customer not found',
          },
        } as ApiResponse),
      };
    }

    // Get or create Stripe customer
    let stripeCustomer: Stripe.Customer;
    if (customer.stripeCustomerId) {
      stripeCustomer = await stripe.customers.retrieve(customer.stripeCustomerId) as Stripe.Customer;
    } else {
      stripeCustomer = await stripe.customers.create({
        email: customer.email,
        name: customer.name,
        metadata: {
          customerId: customer.customerId,
        },
      });

      // Update customer with Stripe ID
      await DB.update(TABLES.CUSTOMERS, { customerId }, {
        stripeCustomerId: stripeCustomer.id,
        updatedAt: new Date().toISOString(),
      });
    }

    // Calculate amounts
    const pricing = PLANS_PRICING[plan as keyof typeof PLANS_PRICING];
    const deviceTotal = pricing.devicePrice * deviceQuantity;

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomer.id,
      mode: 'subscription',
      line_items: [
        // Device purchase (one-time)
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `ECG Device (${plan})`,
              description: `${deviceQuantity} device(s)`,
            },
            unit_amount: pricing.devicePrice,
          },
          quantity: deviceQuantity,
        },
        // Subscription (recurring)
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${plan} Plan`,
              description: 'Monthly subscription',
            },
            unit_amount: pricing.monthlyPrice,
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 30,
        metadata: {
          customerId: customer.customerId,
          plan,
          deviceQuantity: deviceQuantity.toString(),
        },
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        customerId: customer.customerId,
        plan,
        deviceQuantity: deviceQuantity.toString(),
      },
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: true,
        data: {
          sessionId: session.id,
          url: session.url,
        },
      } as ApiResponse),
    };
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Internal server error',
        },
      } as ApiResponse),
    };
  }
};
