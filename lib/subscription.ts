// ============================================
// PLAN DEFINITIONS & LIMITS
// ============================================

export type PlanType = 'free' | 'standard' | 'pro';

export interface PlanLimits {
  maxBooks: number;
  maxSessionsPerMonth: number;    // -1 = unlimited
  maxSessionMinutes: number;
  hasSessionHistory: boolean;
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  free: {
    maxBooks: 1,
    maxSessionsPerMonth: 5,
    maxSessionMinutes: 5,
    hasSessionHistory: false,
  },
  standard: {
    maxBooks: 10,
    maxSessionsPerMonth: 100,
    maxSessionMinutes: 15,
    hasSessionHistory: true,
  },
  pro: {
    maxBooks: 100,
    maxSessionsPerMonth: -1,      // unlimited
    maxSessionMinutes: 60,
    hasSessionHistory: true,
  },
};

// Clerk Dashboard plan slugs
export const PLAN_SLUGS = {
  standard: 'standard',
  pro: 'pro',
} as const;

// ============================================
// BILLING PERIOD HELPERS
// ============================================

/** Returns the first day of the current calendar month (UTC-like local). */
export const getCurrentBillingPeriodStart = (): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
};
