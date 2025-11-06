/**
 * Get Customer Lambda Function
 * GET /customers/{customerId}
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { DB, TABLES } from '../shared/db';
import type { Customer, ApiResponse } from '../shared/types';

export const handler: APIGatewayProxyHandler = async (event) => {
  const customerId = event.pathParameters?.customerId;

  if (!customerId) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: false,
        error: {
          code: 'MISSING_CUSTOMER_ID',
          message: 'Customer ID is required',
        },
      } as ApiResponse),
    };
  }

  try {
    const customer = await DB.get(TABLES.CUSTOMERS, { customerId }) as Customer;

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

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: true,
        data: customer,
      } as ApiResponse<Customer>),
    };
  } catch (error: any) {
    console.error('Error getting customer:', error);
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
