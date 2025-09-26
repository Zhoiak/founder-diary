import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().min(2).max(100),
});

export const createLogSchema = z.object({
  projectId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  title: z.string().min(1).max(200),
  content_md: z.string().default(""),
  tags: z.array(z.string()).default([]),
  mood: z.number().int().min(1).max(5).optional(),
  time_spent_minutes: z.number().int().min(0).max(24 * 60).optional(),
});

export const updateLogSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200).optional(),
  content_md: z.string().optional(),
  tags: z.array(z.string()).optional(),
  mood: z.number().int().min(1).max(5).optional(),
  time_spent_minutes: z.number().int().min(0).max(24 * 60).optional(),
});

export const createGoalSchema = z.object({
  projectId: z.string().uuid(),
  objective: z.string().min(2),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  key_results: z
    .array(
      z.object({
        name: z.string().min(1),
        target: z.number().optional(),
        unit: z.string().optional(),
      })
    )
    .default([]),
});

export const updateKRSchema = z.object({
  id: z.string().uuid(),
  current: z.number(),
});

export const weeklyReviewSchema = z.object({
  projectId: z.string().uuid(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const investorUpdateSchema = z.object({
  projectId: z.string().uuid(),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
});
