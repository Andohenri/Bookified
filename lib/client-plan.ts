import { useAuth } from '@clerk/nextjs';
import { PLAN_LIMITS, PLAN_SLUGS, type PlanType } from './subscription';

/**
 * Client-side hook that resolves the user's current plan via Clerk's `has()`.
 */
export const useUserPlan = () => {
  const { has, isLoaded } = useAuth();

  const getPlan = (): PlanType => {
    if (!isLoaded || !has) return 'free';
    if (has({ plan: PLAN_SLUGS.pro })) return 'pro';
    if (has({ plan: PLAN_SLUGS.standard })) return 'standard';
    return 'free';
  };

  const plan = getPlan();
  const limits = PLAN_LIMITS[plan];

  return { plan, limits, isLoaded };
};
