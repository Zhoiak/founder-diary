import { pgTable, uuid, text, timestamp, integer, boolean, date, numeric, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ================================================================
// MIGRACIÓN COMPLETA SUPABASE → POSTGRESQL
// 10 TABLAS CRÍTICAS - FASE 2 CORE BUSINESS
// ================================================================

// TABLA RAÍZ - PROJECTS
export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  owner: uuid('owner').notNull(), // FK to users
  name: text('name').notNull(),
  slug: text('slug'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  featureFlags: jsonb('feature_flags').default({}),
  privateVault: boolean('private_vault').default(false),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// CORE BUSINESS TABLES - NIVEL 1

export const dailyLogs = pgTable('daily_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id'), // FK to projects
  userId: uuid('user_id'), // FK to users
  date: date('date').notNull(),
  title: text('title'),
  contentMd: text('content_md'),
  tags: text('tags').array().default([]),
  mood: integer('mood'),
  timeSpentMinutes: integer('time_spent_minutes').default(0),
  aiSummary: text('ai_summary'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const goals = pgTable('goals', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id'), // FK to projects
  userId: uuid('user_id'), // FK to users
  objective: text('objective').notNull(),
  dueDate: date('due_date'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const weeklyReviews = pgTable('weekly_reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id'), // FK to projects
  userId: uuid('user_id'), // FK to users
  weekStart: date('week_start').notNull(),
  weekEnd: date('week_end').notNull(),
  contentMd: text('content_md'),
  aiSummary: text('ai_summary'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const investorUpdates = pgTable('investor_updates', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id'), // FK to projects
  userId: uuid('user_id'), // FK to users
  month: integer('month'),
  year: integer('year'),
  contentMd: text('content_md'),
  aiSummary: text('ai_summary'),
  publicSlug: text('public_slug'),
  isPublic: boolean('is_public').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const decisions = pgTable('decisions', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id'), // FK to projects
  userId: uuid('user_id'), // FK to users
  title: text('title').notNull(),
  contextMd: text('context_md'),
  optionsMd: text('options_md'),
  decisionMd: text('decision_md'),
  consequencesMd: text('consequences_md'),
  status: text('status').default('proposed'),
  relatesTo: text('relates_to').array(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// PERSONAL LIFE OS TABLES

export const lifeAreasNew = pgTable('life_areas_new', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id'), // FK to projects
  userId: uuid('user_id'), // FK to users
  key: text('key').notNull(),
  label: text('label').notNull(),
  color: text('color').default('#3B82F6'),
  icon: text('icon').default('🌟'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const personalEntriesNew = pgTable('personal_entries_new', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id'), // FK to projects
  userId: uuid('user_id'), // FK to users
  date: date('date').notNull(),
  title: text('title'),
  contentMd: text('content_md'),
  tags: text('tags').array().default([]),
  mood: integer('mood'),
  energy: integer('energy'),
  sleepHours: numeric('sleep_hours'),
  sentiment: numeric('sentiment'),
  latitude: numeric('latitude'),
  longitude: numeric('longitude'),
  locationName: text('location_name'),
  photos: jsonb('photos').default([]),
  isPrivate: boolean('is_private').default(false),
  encryptedContent: text('encrypted_content'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const habitsNew = pgTable('habits_new', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id'), // FK to projects
  userId: uuid('user_id'), // FK to users
  title: text('title').notNull(),
  description: text('description'),
  schedule: text('schedule'),
  targetPerWeek: integer('target_per_week').default(7),
  areaId: uuid('area_id'), // FK to life_areas
  color: text('color').default('#10B981'),
  icon: text('icon').default('✅'),
  archived: boolean('archived').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const routinesNew = pgTable('routines_new', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id'), // FK to projects
  userId: uuid('user_id'), // FK to users
  kind: text('kind').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  active: boolean('active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ================================================================
// RELACIONES DRIZZLE
// ================================================================

export const projectsRelations = relations(projects, ({ many }) => ({
  dailyLogs: many(dailyLogs),
  goals: many(goals),
  weeklyReviews: many(weeklyReviews),
  investorUpdates: many(investorUpdates),
  decisions: many(decisions),
  lifeAreas: many(lifeAreasNew),
  personalEntries: many(personalEntriesNew),
  habits: many(habitsNew),
  routines: many(routinesNew),
}));

export const dailyLogsRelations = relations(dailyLogs, ({ one }) => ({
  project: one(projects, {
    fields: [dailyLogs.projectId],
    references: [projects.id],
  }),
}));

export const goalsRelations = relations(goals, ({ one }) => ({
  project: one(projects, {
    fields: [goals.projectId],
    references: [projects.id],
  }),
}));

export const weeklyReviewsRelations = relations(weeklyReviews, ({ one }) => ({
  project: one(projects, {
    fields: [weeklyReviews.projectId],
    references: [projects.id],
  }),
}));

export const investorUpdatesRelations = relations(investorUpdates, ({ one }) => ({
  project: one(projects, {
    fields: [investorUpdates.projectId],
    references: [projects.id],
  }),
}));

export const decisionsRelations = relations(decisions, ({ one }) => ({
  project: one(projects, {
    fields: [decisions.projectId],
    references: [projects.id],
  }),
}));

export const lifeAreasRelations = relations(lifeAreasNew, ({ one, many }) => ({
  project: one(projects, {
    fields: [lifeAreasNew.projectId],
    references: [projects.id],
  }),
  habits: many(habitsNew),
  personalEntries: many(personalEntriesNew),
}));

export const personalEntriesRelations = relations(personalEntriesNew, ({ one }) => ({
  project: one(projects, {
    fields: [personalEntriesNew.projectId],
    references: [projects.id],
  }),
}));

export const habitsRelations = relations(habitsNew, ({ one }) => ({
  project: one(projects, {
    fields: [habitsNew.projectId],
    references: [projects.id],
  }),
  lifeArea: one(lifeAreasNew, {
    fields: [habitsNew.areaId],
    references: [lifeAreasNew.id],
  }),
}));

export const routinesRelations = relations(routinesNew, ({ one }) => ({
  project: one(projects, {
    fields: [routinesNew.projectId],
    references: [projects.id],
  }),
}));

// ================================================================
// EXPORT ALL TABLES FOR DRIZZLE
// ================================================================

export const migrationTables = {
  projects,
  dailyLogs,
  goals,
  weeklyReviews,
  investorUpdates,
  decisions,
  lifeAreasNew,
  personalEntriesNew,
  habitsNew,
  routinesNew,
};
