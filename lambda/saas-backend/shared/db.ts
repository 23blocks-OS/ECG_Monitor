/**
 * DynamoDB helper functions
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  UpdateCommand,
  QueryCommand,
  ScanCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const TABLES = {
  CUSTOMERS: process.env.CUSTOMERS_TABLE || 'ecg-monitor-saas-customers',
  ORDERS: process.env.ORDERS_TABLE || 'ecg-monitor-saas-orders',
  SUBSCRIPTIONS: process.env.SUBSCRIPTIONS_TABLE || 'ecg-monitor-saas-subscriptions',
  DEVICES: process.env.DEVICES_TABLE || 'ecg-monitor-saas-devices',
  VENDOR_ORDERS: process.env.VENDOR_ORDERS_TABLE || 'ecg-monitor-saas-vendor-orders',
};

export class DB {
  static async put(tableName: string, item: any) {
    const command = new PutCommand({
      TableName: tableName,
      Item: item,
    });
    return docClient.send(command);
  }

  static async get(tableName: string, key: any) {
    const command = new GetCommand({
      TableName: tableName,
      Key: key,
    });
    const result = await docClient.send(command);
    return result.Item;
  }

  static async update(tableName: string, key: any, updates: Record<string, any>) {
    const updateExpression = 'SET ' + Object.keys(updates)
      .map((k, i) => `#field${i} = :value${i}`)
      .join(', ');

    const expressionAttributeNames = Object.keys(updates).reduce((acc, k, i) => {
      acc[`#field${i}`] = k;
      return acc;
    }, {} as Record<string, string>);

    const expressionAttributeValues = Object.values(updates).reduce((acc, v, i) => {
      acc[`:value${i}`] = v;
      return acc;
    }, {} as Record<string, any>);

    const command = new UpdateCommand({
      TableName: tableName,
      Key: key,
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    });

    const result = await docClient.send(command);
    return result.Attributes;
  }

  static async query(tableName: string, params: any) {
    const command = new QueryCommand({
      TableName: tableName,
      ...params,
    });
    const result = await docClient.send(command);
    return result.Items || [];
  }

  static async scan(tableName: string, params?: any) {
    const command = new ScanCommand({
      TableName: tableName,
      ...params,
    });
    const result = await docClient.send(command);
    return result.Items || [];
  }

  static async delete(tableName: string, key: any) {
    const command = new DeleteCommand({
      TableName: tableName,
      Key: key,
    });
    return docClient.send(command);
  }
}

export { TABLES };
