"use client";

import { useState, useEffect } from 'react';

export interface FeatureFlag {
  flagName: string;
  isEnabled: boolean;
  description?: string;
  targetAudience: 'all' | 'beta' | 'admin';
  hasUserOverride?: boolean;
  globalEnabled?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FeatureFlagsState {
  flags: FeatureFlag[];
  loading: boolean;
  error: string | null;
}

export function useFeatureFlagsPg() {
  const [state, setState] = useState<FeatureFlagsState>({
    flags: [],
    loading: true,
    error: null,
  });

  const fetchFlags = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await fetch('/api/feature-flags', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch feature flags');
      }
      
      const data = await response.json();
      
      setState({
        flags: data.flags || [],
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error('Error fetching feature flags:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  };

  const isEnabled = (flagName: string): boolean => {
    const flag = state.flags.find(f => f.flagName === flagName);
    return flag?.isEnabled || false;
  };

  const getFlag = (flagName: string): FeatureFlag | undefined => {
    return state.flags.find(f => f.flagName === flagName);
  };

  const setUserOverride = async (flagName: string, isEnabled: boolean) => {
    try {
      const response = await fetch('/api/user/feature-flags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ flagName, isEnabled }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to set user override');
      }
      
      // Refresh flags
      await fetchFlags();
    } catch (error) {
      console.error('Error setting user override:', error);
      throw error;
    }
  };

  const removeUserOverride = async (flagName: string) => {
    try {
      const response = await fetch(`/api/user/feature-flags?flagName=${flagName}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to remove user override');
      }
      
      // Refresh flags
      await fetchFlags();
    } catch (error) {
      console.error('Error removing user override:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchFlags();
  }, []);

  return {
    ...state,
    isEnabled,
    getFlag,
    setUserOverride,
    removeUserOverride,
    refresh: fetchFlags,
  };
}

// Specific feature flag hooks for common flags
export function usePersonalMode() {
  const { isEnabled } = useFeatureFlagsPg();
  return isEnabled('personal_mode');
}

export function useDiaryPlus() {
  const { isEnabled } = useFeatureFlagsPg();
  return isEnabled('diary_plus');
}

export function useBetaFeatures() {
  const { isEnabled } = useFeatureFlagsPg();
  return isEnabled('beta_features');
}

export function useExportFeatures() {
  const { isEnabled } = useFeatureFlagsPg();
  return isEnabled('export_yearbook');
}
