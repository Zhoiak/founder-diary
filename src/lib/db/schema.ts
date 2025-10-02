import { 
  pgTable, 
  uuid, 
  varchar, 
  text, 
  boolean, 
  timestamp, 
  integer, 
  date,
  jsonb,
  index,
  unique
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ================================================================
// CORE TABLES (Founder Tools)
// ================================================================

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  passwordHash: varchar('password_hash', { length: 255 }),
  name: varchar('name', { length: 255 }),
  avatarUrl: text('avatar_url'),
  role: varchar('role', { length: 50 }).default('user'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  emailIdx: index('idx_users_email').on(table.email),
}));

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  status: varchar('status', { length: 50 }).default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_projects_user_id').on(table.userId),
}));

export const entries = pgTable('entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }),
  content: text('content'),
  mood: integer('mood'),
  energyLevel: integer('energy_level'),
  tags: text('tags').array(),
  isPrivate: boolean('is_private').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_entries_user_id').on(table.userId),
  projectIdIdx: index('idx_entries_project_id').on(table.projectId),
  createdAtIdx: index('idx_entries_created_at').on(table.createdAt),
}));

// ================================================================
// DIARY+ TABLES (Personal Life OS)
// ================================================================

export const featureFlags = pgTable('feature_flags', {
  id: uuid('id').primaryKey().defaultRandom(),
  flagName: varchar('flag_name', { length: 100 }).unique().notNull(),
  isEnabled: boolean('is_enabled').default(false),
  description: text('description'),
  targetAudience: varchar('target_audience', { length: 50 }).default('all'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const userFeatureFlags = pgTable('user_feature_flags', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  flagName: varchar('flag_name', { length: 100 }).notNull(),
  isEnabled: boolean('is_enabled').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  userFlagUnique: unique('user_feature_flags_user_id_flag_name_unique').on(table.userId, table.flagName),
}));

export const lifeAreas = pgTable('life_areas', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  color: varchar('color', { length: 7 }),
  icon: varchar('icon', { length: 50 }),
  sortOrder: integer('sort_order').default(0),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const personalEntries = pgTable('personal_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  lifeAreaId: uuid('life_area_id').references(() => lifeAreas.id, { onDelete: 'set null' }),
  title: varchar('title', { length: 255 }),
  content: text('content'),
  mood: integer('mood'),
  energyLevel: integer('energy_level'),
  gratitudeNotes: text('gratitude_notes').array(),
  goalsProgress: jsonb('goals_progress'),
  tags: text('tags').array(),
  isPrivate: boolean('is_private').default(true),
  entryType: varchar('entry_type', { length: 50 }).default('daily'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_personal_entries_user_id').on(table.userId),
  lifeAreaIdIdx: index('idx_personal_entries_life_area_id').on(table.lifeAreaId),
  createdAtIdx: index('idx_personal_entries_created_at').on(table.createdAt),
}));

export const habits = pgTable('habits', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  lifeAreaId: uuid('life_area_id').references(() => lifeAreas.id, { onDelete: 'set null' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  frequency: varchar('frequency', { length: 50 }).default('daily'),
  targetCount: integer('target_count').default(1),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_habits_user_id').on(table.userId),
}));

export const habitCompletions = pgTable('habit_completions', {
  id: uuid('id').primaryKey().defaultRandom(),
  habitId: uuid('habit_id').references(() => habits.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  completedAt: timestamp('completed_at', { withTimezone: true }).defaultNow(),
  completedDate: date('completed_date').generatedAlwaysAs('completed_at::date'),
  notes: text('notes'),
}, (table) => ({
  habitIdIdx: index('idx_habit_completions_habit_id').on(table.habitId),
  userIdIdx: index('idx_habit_completions_user_id').on(table.userId),
  uniqueDaily: unique('habit_completions_unique_daily').on(table.habitId, table.userId, table.completedDate),
}));

export const routines = pgTable('routines', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  routineType: varchar('routine_type', { length: 50 }).notNull(),
  steps: jsonb('steps'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const goals = pgTable('goals', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  lifeAreaId: uuid('life_area_id').references(() => lifeAreas.id, { onDelete: 'set null' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  targetDate: date('target_date'),
  status: varchar('status', { length: 50 }).default('active'),
  progress: integer('progress').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_goals_user_id').on(table.userId),
}));

export const timeCapsules = pgTable('time_capsules', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  deliveryDate: timestamp('delivery_date', { withTimezone: true }).notNull(),
  isDelivered: boolean('is_delivered').default(false),
  deliveredAt: timestamp('delivered_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_time_capsules_user_id').on(table.userId),
  deliveryDateIdx: index('idx_time_capsules_delivery_date').on(table.deliveryDate),
}));

export const reminders = pgTable('reminders', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message'),
  reminderType: varchar('reminder_type', { length: 50 }).notNull(),
  scheduledFor: timestamp('scheduled_for', { withTimezone: true }).notNull(),
  isSent: boolean('is_sent').default(false),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_reminders_user_id').on(table.userId),
  scheduledForIdx: index('idx_reminders_scheduled_for').on(table.scheduledFor),
}));

export const vaultEntries = pgTable('vault_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  titleEncrypted: text('title_encrypted').notNull(),
  contentEncrypted: text('content_encrypted').notNull(),
  encryptionKeyHash: varchar('encryption_key_hash', { length: 255 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const exportRequests = pgTable('export_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  exportType: varchar('export_type', { length: 50 }).notNull(),
  dateRangeStart: date('date_range_start'),
  dateRangeEnd: date('date_range_end'),
  includePrivate: boolean('include_private').default(false),
  status: varchar('status', { length: 50 }).default('pending'),
  fileUrl: text('file_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
});

export const betaCohorts = pgTable('beta_cohorts', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  startDate: date('start_date').notNull(),
  endDate: date('end_date'),
  maxUsers: integer('max_users'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const betaUserCohorts = pgTable('beta_user_cohorts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  cohortId: uuid('cohort_id').references(() => betaCohorts.id, { onDelete: 'cascade' }),
  joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  userCohortUnique: unique('beta_user_cohorts_user_id_cohort_id_unique').on(table.userId, table.cohortId),
}));

export const cronJobLogs = pgTable('cron_job_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  jobName: varchar('job_name', { length: 255 }).notNull(),
  status: varchar('status', { length: 50 }).notNull(),
  message: text('message'),
  executionTimeMs: integer('execution_time_ms'),
  startedAt: timestamp('started_at', { withTimezone: true }).defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
});

// ================================================================
// RELATIONS
// ================================================================

export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
  entries: many(entries),
  personalEntries: many(personalEntries),
  habits: many(habits),
  goals: many(goals),
  timeCapsules: many(timeCapsules),
  reminders: many(reminders),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, {
    fields: [projects.userId],
    references: [users.id],
  }),
  entries: many(entries),
}));

export const entriesRelations = relations(entries, ({ one }) => ({
  user: one(users, {
    fields: [entries.userId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [entries.projectId],
    references: [projects.id],
  }),
}));

export const lifeAreasRelations = relations(lifeAreas, ({ one, many }) => ({
  user: one(users, {
    fields: [lifeAreas.userId],
    references: [users.id],
  }),
  personalEntries: many(personalEntries),
  habits: many(habits),
  goals: many(goals),
}));

export const habitsRelations = relations(habits, ({ one, many }) => ({
  user: one(users, {
    fields: [habits.userId],
    references: [users.id],
  }),
  lifeArea: one(lifeAreas, {
    fields: [habits.lifeAreaId],
    references: [lifeAreas.id],
  }),
  completions: many(habitCompletions),
}));

export const habitCompletionsRelations = relations(habitCompletions, ({ one }) => ({
  habit: one(habits, {
    fields: [habitCompletions.habitId],
    references: [habits.id],
  }),
  user: one(users, {
    fields: [habitCompletions.userId],
    references: [users.id],
  }),
}));
