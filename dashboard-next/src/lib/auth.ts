/**
 * AWS Cognito Authentication Helper Library
 *
 * This module provides authentication functions for ECG Monitor dashboards.
 * Uses AWS Amplify for Cognito integration.
 *
 * Usage:
 *   import { authHelpers } from '@/lib/auth';
 *   const result = await authHelpers.signIn(email, password);
 */

import { Amplify } from '@aws-amplify/core';
import { Auth } from '@aws-amplify/auth';

// Configuration will be loaded from environment variables
// Set these in your .env.local file
const amplifyConfig = {
  Auth: {
    region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
    userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID!,
    userPoolWebClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
    mandatorySignIn: true,
    authenticationFlowType: 'USER_SRP_AUTH',

    // Optional: Hosted UI configuration
    oauth: {
      domain: process.env.NEXT_PUBLIC_COGNITO_DOMAIN!,
      scope: ['email', 'openid', 'profile'],
      redirectSignIn: process.env.NEXT_PUBLIC_REDIRECT_SIGN_IN || 'http://localhost:3000/callback',
      redirectSignOut: process.env.NEXT_PUBLIC_REDIRECT_SIGN_OUT || 'http://localhost:3000/',
      responseType: 'code',
    },
  },
};

// Configure Amplify
Amplify.configure(amplifyConfig);

/**
 * Authentication helper functions
 */
export const authHelpers = {
  /**
   * Sign up a new user
   */
  async signUp(
    email: string,
    password: string,
    name: string,
    organizationId?: string,
    role?: string
  ): Promise<{ success: boolean; user?: any; error?: any }> {
    try {
      const { user } = await Auth.signUp({
        username: email,
        password,
        attributes: {
          email,
          name,
          ...(organizationId && { 'custom:organization_id': organizationId }),
          ...(role && { 'custom:role': role }),
        },
      });
      return { success: true, user };
    } catch (error) {
      console.error('Sign up error:', error);
      return { success: false, error };
    }
  },

  /**
   * Confirm sign up with verification code
   */
  async confirmSignUp(
    email: string,
    code: string
  ): Promise<{ success: boolean; error?: any }> {
    try {
      await Auth.confirmSignUp(email, code);
      return { success: true };
    } catch (error) {
      console.error('Confirmation error:', error);
      return { success: false, error };
    }
  },

  /**
   * Resend confirmation code
   */
  async resendConfirmationCode(
    email: string
  ): Promise<{ success: boolean; error?: any }> {
    try {
      await Auth.resendSignUp(email);
      return { success: true };
    } catch (error) {
      console.error('Resend code error:', error);
      return { success: false, error };
    }
  },

  /**
   * Sign in
   */
  async signIn(
    email: string,
    password: string
  ): Promise<{ success: boolean; user?: any; error?: any }> {
    try {
      const user = await Auth.signIn(email, password);
      return { success: true, user };
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error };
    }
  },

  /**
   * Sign out
   */
  async signOut(): Promise<{ success: boolean; error?: any }> {
    try {
      await Auth.signOut();
      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      return { success: false, error };
    }
  },

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<{ success: boolean; user?: any; error?: any }> {
    try {
      const user = await Auth.currentAuthenticatedUser();
      return { success: true, user };
    } catch (error) {
      return { success: false, error };
    }
  },

  /**
   * Get JWT access token for API calls
   */
  async getAccessToken(): Promise<string | null> {
    try {
      const session = await Auth.currentSession();
      return session.getAccessToken().getJwtToken();
    } catch (error) {
      console.error('Token error:', error);
      return null;
    }
  },

  /**
   * Get ID token (contains user claims)
   */
  async getIdToken(): Promise<string | null> {
    try {
      const session = await Auth.currentSession();
      return session.getIdToken().getJwtToken();
    } catch (error) {
      console.error('ID token error:', error);
      return null;
    }
  },

  /**
   * Get user attributes (including custom attributes)
   */
  async getUserAttributes(): Promise<{
    email?: string;
    name?: string;
    organizationId?: string;
    role?: string;
  } | null> {
    try {
      const user = await Auth.currentAuthenticatedUser();
      const attributes = await Auth.userAttributes(user);

      const attributeMap: Record<string, string> = {};
      attributes.forEach((attr) => {
        attributeMap[attr.Name] = attr.Value;
      });

      return {
        email: attributeMap.email,
        name: attributeMap.name,
        organizationId: attributeMap['custom:organization_id'],
        role: attributeMap['custom:role'],
      };
    } catch (error) {
      console.error('Get attributes error:', error);
      return null;
    }
  },

  /**
   * Update user attributes
   */
  async updateUserAttributes(
    attributes: Record<string, string>
  ): Promise<{ success: boolean; error?: any }> {
    try {
      const user = await Auth.currentAuthenticatedUser();
      await Auth.updateUserAttributes(user, attributes);
      return { success: true };
    } catch (error) {
      console.error('Update attributes error:', error);
      return { success: false, error };
    }
  },

  /**
   * Change password
   */
  async changePassword(
    oldPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: any }> {
    try {
      const user = await Auth.currentAuthenticatedUser();
      await Auth.changePassword(user, oldPassword, newPassword);
      return { success: true };
    } catch (error) {
      console.error('Change password error:', error);
      return { success: false, error };
    }
  },

  /**
   * Forgot password (initiate reset)
   */
  async forgotPassword(
    email: string
  ): Promise<{ success: boolean; error?: any }> {
    try {
      await Auth.forgotPassword(email);
      return { success: true };
    } catch (error) {
      console.error('Forgot password error:', error);
      return { success: false, error };
    }
  },

  /**
   * Forgot password submit (with code)
   */
  async forgotPasswordSubmit(
    email: string,
    code: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: any }> {
    try {
      await Auth.forgotPasswordSubmit(email, code, newPassword);
      return { success: true };
    } catch (error) {
      console.error('Forgot password submit error:', error);
      return { success: false, error };
    }
  },

  /**
   * Set up TOTP MFA
   */
  async setupTOTP(): Promise<{ success: boolean; qrCode?: string; error?: any }> {
    try {
      const user = await Auth.currentAuthenticatedUser();
      const code = await Auth.setupTOTP(user);

      // Generate QR code string
      const appName = 'ECGMonitor';
      const qrCodeUrl = `otpauth://totp/${appName}:${user.username}?secret=${code}&issuer=${appName}`;

      return { success: true, qrCode: qrCodeUrl };
    } catch (error) {
      console.error('Setup TOTP error:', error);
      return { success: false, error };
    }
  },

  /**
   * Verify TOTP and enable MFA
   */
  async verifyTOTP(
    code: string
  ): Promise<{ success: boolean; error?: any }> {
    try {
      const user = await Auth.currentAuthenticatedUser();
      await Auth.verifyTotpToken(user, code);
      await Auth.setPreferredMFA(user, 'TOTP');
      return { success: true };
    } catch (error) {
      console.error('Verify TOTP error:', error);
      return { success: false, error };
    }
  },

  /**
   * Disable MFA
   */
  async disableMFA(): Promise<{ success: boolean; error?: any }> {
    try {
      const user = await Auth.currentAuthenticatedUser();
      await Auth.setPreferredMFA(user, 'NOMFA');
      return { success: true };
    } catch (error) {
      console.error('Disable MFA error:', error);
      return { success: false, error };
    }
  },

  /**
   * Sign in with Hosted UI
   */
  signInWithHostedUI() {
    Auth.federatedSignIn();
  },
};

export default Auth;
