"use client";

import { useState, useEffect, useCallback } from "react";

export interface FeatureFlags {
  diary_personal: boolean;
  habits: boolean;
  routines: boolean;
  people: boolean;
  learning: boolean;
  memories: boolean;
  insights: boolean;
  yearbook: boolean;
}

export interface Project {
  id: string;
  name: string;
  slug: string;
  feature_flags: FeatureFlags;
  private_vault: boolean;
}

export function useFeatureFlags(projectId?: string) {
  const [flags, setFlags] = useState<FeatureFlags>({
    diary_personal: false,
    habits: false,
    routines: false,
    people: false,
    learning: false,
    memories: false,
    insights: false,
    yearbook: false,
  });
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchFlags = useCallback(async () => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/projects/${projectId}`);
      if (!res.ok) throw new Error("Failed to fetch project");
      
      const data = await res.json();
      const projectData = data.project;
      
      setProject(projectData);
      setFlags(projectData.feature_flags || {
        diary_personal: false,
        habits: false,
        routines: false,
        people: false,
        learning: false,
        memories: false,
        insights: false,
        yearbook: false,
      });
    } catch (error) {
      console.error("Error fetching feature flags:", error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  const updateFlags = async (newFlags: Partial<FeatureFlags>) => {
    if (!projectId) return;

    try {
      const updatedFlags = { ...flags, ...newFlags };
      
      const res = await fetch(`/api/projects/${projectId}/feature-flags`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feature_flags: updatedFlags }),
      });

      if (!res.ok) throw new Error("Failed to update feature flags");
      
      setFlags(updatedFlags);
      if (project) {
        setProject({ ...project, feature_flags: updatedFlags });
      }
    } catch (error) {
      console.error("Error updating feature flags:", error);
      throw error;
    }
  };

  const isEnabled = (flag: keyof FeatureFlags): boolean => {
    return flags[flag] === true;
  };

  const getEnabledFlags = (): (keyof FeatureFlags)[] => {
    return Object.entries(flags)
      .filter(([_, enabled]) => enabled)
      .map(([flag, _]) => flag as keyof FeatureFlags);
  };

  const getMode = (): 'founder' | 'personal' => {
    return project?.name === 'Personal' ? 'personal' : 'founder';
  };

  return {
    flags,
    project,
    loading,
    isEnabled,
    updateFlags,
    getEnabledFlags,
    getMode,
    refetch: fetchFlags,
  };
}
