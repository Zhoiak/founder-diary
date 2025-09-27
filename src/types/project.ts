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
  feature_flags?: FeatureFlags;
  private_vault?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ProjectWithStats extends Project {
  logs_count?: number;
  goals_count?: number;
  reviews_count?: number;
  updates_count?: number;
}
