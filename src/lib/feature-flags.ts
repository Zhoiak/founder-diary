import { db } from '@/lib/db';
import { featureFlags, userFeatureFlags } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export interface FeatureFlag {
  flagName: string;
  isEnabled: boolean;
  description?: string;
  targetAudience: 'all' | 'beta' | 'admin';
  hasUserOverride?: boolean;
  globalEnabled?: boolean;
}

/**
 * Check if a feature flag is enabled for a specific user
 * @param flagName - Name of the feature flag
 * @param userId - User ID to check
 * @returns Promise<boolean> - Whether the flag is enabled
 */
export async function isFeatureEnabled(
  flagName: string, 
  userId?: string
): Promise<boolean> {
  try {
    // Get global flag
    const globalFlag = await db
      .select()
      .from(featureFlags)
      .where(eq(featureFlags.flagName, flagName))
      .limit(1);
    
    if (globalFlag.length === 0) {
      // Flag doesn't exist, default to false
      return false;
    }
    
    const flag = globalFlag[0];
    
    // If no user ID provided, return global setting
    if (!userId) {
      return flag.isEnabled;
    }
    
    // Check for user override
    const userOverride = await db
      .select()
      .from(userFeatureFlags)
      .where(
        and(
          eq(userFeatureFlags.userId, userId),
          eq(userFeatureFlags.flagName, flagName)
        )
      )
      .limit(1);
    
    // Return user override if exists, otherwise global setting
    return userOverride.length > 0 ? userOverride[0].isEnabled : flag.isEnabled;
    
  } catch (error) {
    console.error(`Error checking feature flag ${flagName}:`, error);
    return false; // Default to disabled on error
  }
}

/**
 * Get all feature flags for a user with their effective values
 * @param userId - User ID to get flags for
 * @returns Promise<FeatureFlag[]> - Array of feature flags with effective values
 */
export async function getUserFeatureFlags(userId: string): Promise<FeatureFlag[]> {
  try {
    // Get all global flags
    const globalFlags = await db.select().from(featureFlags);
    
    // Get user overrides
    const userOverrides = await db
      .select()
      .from(userFeatureFlags)
      .where(eq(userFeatureFlags.userId, userId));
    
    // Create override map for quick lookup
    const overrideMap = new Map(
      userOverrides.map(override => [override.flagName, override.isEnabled])
    );
    
    // Combine global flags with user overrides
    return globalFlags.map(flag => ({
      flagName: flag.flagName,
      isEnabled: overrideMap.has(flag.flagName) 
        ? overrideMap.get(flag.flagName)! 
        : flag.isEnabled,
      description: flag.description || undefined,
      targetAudience: flag.targetAudience as 'all' | 'beta' | 'admin',
      hasUserOverride: overrideMap.has(flag.flagName),
      globalEnabled: flag.isEnabled,
    }));
    
  } catch (error) {
    console.error('Error getting user feature flags:', error);
    return [];
  }
}

/**
 * Common feature flag names used in the application
 */
export const FEATURE_FLAGS = {
  PERSONAL_MODE: 'personal_mode',
  DIARY_PLUS: 'diary_plus',
  BETA_FEATURES: 'beta_features',
  ADVANCED_ANALYTICS: 'advanced_analytics',
  COLLABORATION: 'collaboration',
  EXPORT_FEATURES: 'export_features',
  AI_INSIGHTS: 'ai_insights',
} as const;

/**
 * Utility function to check specific feature flags
 */
export const checkFeatureFlag = {
  personalMode: (userId?: string) => isFeatureEnabled(FEATURE_FLAGS.PERSONAL_MODE, userId),
  diaryPlus: (userId?: string) => isFeatureEnabled(FEATURE_FLAGS.DIARY_PLUS, userId),
  betaFeatures: (userId?: string) => isFeatureEnabled(FEATURE_FLAGS.BETA_FEATURES, userId),
  advancedAnalytics: (userId?: string) => isFeatureEnabled(FEATURE_FLAGS.ADVANCED_ANALYTICS, userId),
  collaboration: (userId?: string) => isFeatureEnabled(FEATURE_FLAGS.COLLABORATION, userId),
  exportFeatures: (userId?: string) => isFeatureEnabled(FEATURE_FLAGS.EXPORT_FEATURES, userId),
  aiInsights: (userId?: string) => isFeatureEnabled(FEATURE_FLAGS.AI_INSIGHTS, userId),
};
