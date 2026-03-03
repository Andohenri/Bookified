"use server";

import VoiceSession from "@/database/models/voice-session.model";
import { dbConnect } from "@/database/mongoose";
import { EndSessionResult, StartSessionResult } from "@/types";
import { getCurrentBillingPeriodStart } from "../subscription";
import { getUserPlanLimits } from "../server-plan";

export const startSessionVoice = async (clerkId: string, bookId: string): Promise<StartSessionResult> => {
  try {
    await dbConnect();

    // Check plan limits
    const { plan, limits } = await getUserPlanLimits();
    const billingStart = getCurrentBillingPeriodStart();

    if (limits.maxSessionsPerMonth !== -1) {
      const sessionCount = await VoiceSession.countDocuments({
        clerkId,
        billingPeriodStart: billingStart,
      });

      if (sessionCount >= limits.maxSessionsPerMonth) {
        return {
          success: false,
          error: `You've reached the ${plan} plan limit of ${limits.maxSessionsPerMonth} sessions this month. Upgrade your plan for more.`,
          isBillingError: true,
        };
      }
    }

    const session = await VoiceSession.create({
      clerkId,
      bookId,
      startedAt: new Date(),
      billingPeriodStart: billingStart,
      durationSeconds: 0,
    });

    return {
      success: true,
      sessionId: session._id.toString(),
      maxDurationMinutes: limits.maxSessionMinutes,
    };
  } catch (error) {
    console.error("Error starting session:", error);
    return {
      success: false,
      error: "An error occurred while starting the session. Please try again."
    };
  }
}

export const endVoiceSession = async (sessionId: string, durationSeconds: number): Promise<EndSessionResult> => {
  try {
    await dbConnect();

    const result = await VoiceSession.findByIdAndUpdate(sessionId, {
      endedAt: new Date(),
      durationSeconds,
    });

    if (!result) return { success: false, error: 'Voice session not found.' }

    return { success: true }
  } catch (e) {
    console.error('Error ending voice session', e);
    return { success: false, error: 'Failed to end voice session. Please try again later.' }
  }
}

export const clearSessionErrors = async (clerkId: string): Promise<void> => {
  // This function can be used to clear any session-related errors or reset states if needed.
  // Implementation depends on how you manage session states and errors in your application.
}