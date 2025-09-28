"use client";

import { useState, useEffect, useCallback } from "react";

export interface FeatureFlags {
  // Personal Life OS features
  diary_personal: boolean;
  habits: boolean;
  routines: boolean;
  people: boolean;
  learning: boolean;
  memories: boolean;
  insights: boolean;
  yearbook: boolean;
  
  // Founder Tools features
  goals: boolean;
  weekly_reviews: boolean;
  analytics: boolean;
  decisions: boolean;
  investor_updates: boolean;
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
    // Personal Life OS features
    diary_personal: true,   // Coincide con defaults de SQL
    habits: true,           // Coincide con defaults de SQL
    routines: true,         // Coincide con defaults de SQL
    people: true,           // Coincide con defaults de SQL
    learning: true,         // Coincide con defaults de SQL
    memories: true,         // Coincide con defaults de SQL
    insights: false,        // Por defecto desactivado
    yearbook: false,        // Por defecto desactivado
    
    // Founder Tools features
    goals: true,            // Por defecto activado
    weekly_reviews: true,   // Por defecto activado
    analytics: true,        // Por defecto activado
    decisions: true,        // Por defecto activado
    investor_updates: true, // Por defecto activado
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
      
      // Usar los feature_flags de la base de datos o valores por defecto
      const dbFlags = projectData.feature_flags || {};
      const defaultFlags = {
        // Personal Life OS features
        diary_personal: true,   // Por defecto activado según SQL
        habits: true,           // Por defecto activado según SQL
        routines: true,         // Por defecto activado según SQL
        people: true,           // Por defecto activado según SQL
        learning: true,         // Por defecto activado según SQL
        memories: true,         // Por defecto activado según SQL
        insights: false,        // Por defecto desactivado
        yearbook: false,        // Por defecto desactivado
        
        // Founder Tools features
        goals: true,            // Por defecto activado
        weekly_reviews: true,   // Por defecto activado
        analytics: true,        // Por defecto activado
        decisions: true,        // Por defecto activado
        investor_updates: true, // Por defecto activado
      };
      
      // Combinar flags de DB con defaults
      const finalFlags = { ...defaultFlags, ...dbFlags };
      console.log('Setting flags from DB:', finalFlags);
      setFlags(finalFlags);
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
