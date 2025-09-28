// BETA LAUNCH CONFIGURATION
// Manage beta cohorts and feature rollout

export interface BetaCohort {
  id: string;
  name: string;
  description: string;
  targetUsers: number;
  features: string[];
  metrics: string[];
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface BetaMetrics {
  cohortId: string;
  userId: string;
  event: string;
  properties: Record<string, any>;
  timestamp: string;
}

// Beta cohort definitions
export const BETA_COHORTS: BetaCohort[] = [
  {
    id: 'founders-alpha',
    name: 'Founders Alpha',
    description: 'Early adopters focused on founder tools and decision tracking',
    targetUsers: 50,
    features: [
      'goals',
      'decisions', 
      'investor_updates',
      'weekly_reviews'
    ],
    metrics: [
      'logs_created_weekly',
      'decisions_logged',
      'goals_set',
      'weekly_reviews_completed'
    ],
    startDate: '2025-02-01',
    endDate: '2025-03-31',
    isActive: true
  },
  {
    id: 'personal-beta',
    name: 'Personal Life OS Beta',
    description: 'Users testing the complete personal life management system',
    targetUsers: 100,
    features: [
      'diary_personal',
      'habits',
      'routines',
      'people',
      'learning',
      'memories',
      'yearbook'
    ],
    metrics: [
      'personal_entries_weekly',
      'habits_completed',
      'routines_finished',
      'onboarding_completed',
      'yearbook_generated',
      'vault_setup'
    ],
    startDate: '2025-02-15',
    endDate: '2025-04-15',
    isActive: true
  }
];

// Success criteria for each cohort
export const SUCCESS_CRITERIA = {
  'founders-alpha': {
    primary: {
      metric: 'logs_created_weekly',
      target: 3,
      description: '3+ logs per week'
    },
    secondary: [
      {
        metric: 'weekly_reviews_completed',
        target: 0.6,
        description: '60% weekly review completion rate'
      },
      {
        metric: 'decisions_logged',
        target: 1,
        description: '1+ decision logged per week'
      }
    ]
  },
  'personal-beta': {
    primary: {
      metric: 'personal_entries_weekly',
      target: 5,
      description: '5+ personal entries per week'
    },
    secondary: [
      {
        metric: 'habits_completed',
        target: 4,
        description: '4+ habits completed per week'
      },
      {
        metric: 'routines_finished',
        target: 0.6,
        description: '60% routine completion rate'
      }
    ]
  }
};

// PostHog events for beta tracking
export const BETA_EVENTS = {
  // Onboarding
  'onboarding_started': 'User started onboarding process',
  'onboarding_completed': 'User completed onboarding wizard',
  'cohort_assigned': 'User assigned to beta cohort',
  
  // Founders cohort events
  'log_created': 'Daily log entry created',
  'decision_logged': 'Decision recorded',
  'goal_set': 'Goal created or updated',
  'weekly_review_completed': 'Weekly review finished',
  'investor_update_sent': 'Investor update published',
  
  // Personal cohort events
  'personal_entry_created': 'Personal journal entry created',
  'habit_checked': 'Habit marked as completed',
  'routine_completed': 'Morning/evening routine finished',
  'yearbook_generated': 'Year book PDF/EPUB created',
  'vault_setup': 'Private vault configured',
  'feature_flag_toggled': 'Feature flag changed',
  
  // Engagement events
  'session_started': 'User session began',
  'page_viewed': 'Page navigation',
  'search_performed': 'Search query executed',
  'export_completed': 'Data export finished'
};

// Utility functions
export function getUserCohort(userEmail: string): BetaCohort | null {
  // Simple cohort assignment logic
  // In production, this would be more sophisticated
  
  if (userEmail.includes('founder') || userEmail.includes('ceo')) {
    return BETA_COHORTS.find(c => c.id === 'founders-alpha') || null;
  }
  
  // Default to personal beta
  return BETA_COHORTS.find(c => c.id === 'personal-beta') || null;
}

export function trackBetaEvent(event: string, properties: Record<string, any> = {}) {
  if (typeof window !== 'undefined' && (window as any).posthog) {
    (window as any).posthog.capture(event, {
      ...properties,
      beta_version: '1.0.0',
      timestamp: new Date().toISOString()
    });
  }
}

export function getCohortFeatures(cohortId: string): string[] {
  const cohort = BETA_COHORTS.find(c => c.id === cohortId);
  return cohort?.features || [];
}

export function isCohortFeatureEnabled(cohortId: string, feature: string): boolean {
  const features = getCohortFeatures(cohortId);
  return features.includes(feature);
}

// Beta feedback collection
export interface BetaFeedback {
  userId: string;
  cohortId: string;
  rating: number; // 1-5
  feedback: string;
  category: 'bug' | 'feature' | 'improvement' | 'general';
  page: string;
  timestamp: string;
}

export function submitBetaFeedback(feedback: Omit<BetaFeedback, 'timestamp'>) {
  const fullFeedback: BetaFeedback = {
    ...feedback,
    timestamp: new Date().toISOString()
  };
  
  // Track in PostHog
  trackBetaEvent('beta_feedback_submitted', fullFeedback);
  
  // Could also send to a feedback API
  return fullFeedback;
}
