/**
 * User Roles within the MARSHALL platform.
 */
export enum UserRole {
  FREE = 'FREE',
  PRO = 'PRO',
  BUSINESS = 'BUSINESS',
  ADMIN = 'ADMIN',
}

/**
 * Subscription statuses compatible with Stripe lifecycle events.
 */
export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'past_due'
  | 'unpaid'
  | 'paused';

/**
 * Public profile data attached to an authenticated user.
 */
export interface Profile {
  id: string;
  userId: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Core User entity representing an authenticated account.
 */
export interface User {
  id: string;
  email: string;
  role: UserRole;
  emailVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  profile?: Profile;
}

/**
 * Billing subscription metadata linked to Stripe.
 */
export interface Subscription {
  id: string;
  userId: string;
  tier: UserRole;
  status: SubscriptionStatus;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  canceledAt: string | null;
  trialEnd: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Client authentication session details.
 */
export interface AuthSession {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  tokenType: 'Bearer';
}
