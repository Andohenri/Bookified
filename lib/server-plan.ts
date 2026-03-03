import { auth } from '@clerk/nextjs/server';
import { PLAN_LIMITS, PLAN_SLUGS, type PlanType } from './subscription';

/**
 * Resolves the current user's plan on the server using Clerk's `has()`.
 * Falls back to 'free' if the user has no subscription.
 */
export const getUserPlan = async (): Promise<PlanType> => {
  const { has } = await auth();

  if (has({ plan: PLAN_SLUGS.pro })) return 'pro';
  if (has({ plan: PLAN_SLUGS.standard })) return 'standard';
  return 'free';
};

/** Returns the plan limits for the current server-side user. */
export const getUserPlanLimits = async () => {
  const plan = await getUserPlan();
  return { plan, limits: PLAN_LIMITS[plan] };
};
