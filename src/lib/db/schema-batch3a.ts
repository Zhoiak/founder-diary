import { pgTable, uuid, text, timestamp, integer, boolean, date, numeric, jsonb, inet } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ================================================================
// BATCH 3A - SISTEMAS INDEPENDIENTES (8 TABLAS)
// Sin dependencias - pueden migrarse primero
// ================================================================

// ANIMAL ARCHETYPES SYSTEM
export const animalArchetypes = pgTable('animal_archetypes', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  animalEmoji: text('animal_emoji').notNull(),
  animalIcon: text('animal_icon').notNull(),
  personalityTraits: text('personality_traits').array(),
  strengths: text('strengths').array(),
  challenges: text('challenges').array(),
  motivationStyle: text('motivation_style'),
  preferredReminderStyle: text('preferred_reminder_style'),
  optimalSessionLength: integer('optimal_session_length'),
  bestTimeOfDay: text('best_time_of_day'),
  primaryColor: text('primary_color'),
  secondaryColor: text('secondary_color'),
  gradientFrom: text('gradient_from'),
  gradientTo: text('gradient_to'),
  dopamineTriggers: text('dopamine_triggers').array(),
  stressIndicators: text('stress_indicators').array(),
  recoveryMethods: text('recovery_methods').array(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const userAnimalArchetypes = pgTable('user_animal_archetypes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  archetypeId: uuid('archetype_id').notNull(), // FK to animal_archetypes
  confidenceScore: numeric('confidence_score').default('0.75'),
  customTraits: text('custom_traits').array(),
  adaptationLevel: integer('adaptation_level').default(1),
  engagementScore: numeric('engagement_score').default('0.0'),
  completionRate: numeric('completion_rate').default('0.0'),
  satisfactionScore: numeric('satisfaction_score').default('0.0'),
  assignedAt: timestamp('assigned_at', { withTimezone: true }).defaultNow(),
  lastUpdated: timestamp('last_updated', { withTimezone: true }).defaultNow(),
});

// USER FEEDBACK SYSTEM
export const userFeedback = pgTable('user_feedback', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id'),
  userEmail: text('user_email'),
  feedbackType: text('feedback_type').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  category: text('category'),
  priority: text('priority').default('medium'),
  status: text('status').default('submitted'),
  adminNotes: text('admin_notes'),
  implementationNotes: text('implementation_notes'),
  trackingId: text('tracking_id').notNull(),
  userAgent: text('user_agent'),
  ipAddress: inet('ip_address'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  notifiedAt: timestamp('notified_at', { withTimezone: true }),
});

export const feedbackVotes = pgTable('feedback_votes', {
  id: uuid('id').primaryKey().defaultRandom(),
  feedbackId: uuid('feedback_id').notNull(), // FK to user_feedback
  userId: uuid('user_id'),
  voteType: text('vote_type').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const feedbackComments = pgTable('feedback_comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  feedbackId: uuid('feedback_id').notNull(), // FK to user_feedback
  userId: uuid('user_id'),
  comment: text('comment').notNull(),
  isAdminComment: boolean('is_admin_comment').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const feedbackNotifications = pgTable('feedback_notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  feedbackId: uuid('feedback_id').notNull(), // FK to user_feedback
  userId: uuid('user_id'),
  notificationType: text('notification_type').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  rewardDetails: jsonb('reward_details'),
  readAt: timestamp('read_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// MEMORIES SYSTEM
export const memories = pgTable('memories', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  projectId: uuid('project_id'), // FK to projects (optional)
  title: text('title').notNull(),
  description: text('description'),
  memoryDate: date('memory_date').notNull(),
  locationName: text('location_name'),
  latitude: numeric('latitude'),
  longitude: numeric('longitude'),
  mood: integer('mood'),
  isFavorite: boolean('is_favorite').default(false),
  isPrivate: boolean('is_private').default(false),
  tags: text('tags').array(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const memoryCollections = pgTable('memory_collections', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  projectId: uuid('project_id'), // FK to projects (optional)
  name: text('name').notNull(),
  description: text('description'),
  coverPhotoId: uuid('cover_photo_id'),
  isPublic: boolean('is_public').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ================================================================
// RELACIONES DRIZZLE
// ================================================================

export const animalArchetypesRelations = relations(animalArchetypes, ({ many }) => ({
  userArchetypes: many(userAnimalArchetypes),
}));

export const userAnimalArchetypesRelations = relations(userAnimalArchetypes, ({ one }) => ({
  archetype: one(animalArchetypes, {
    fields: [userAnimalArchetypes.archetypeId],
    references: [animalArchetypes.id],
  }),
}));

export const userFeedbackRelations = relations(userFeedback, ({ many }) => ({
  votes: many(feedbackVotes),
  comments: many(feedbackComments),
  notifications: many(feedbackNotifications),
}));

export const feedbackVotesRelations = relations(feedbackVotes, ({ one }) => ({
  feedback: one(userFeedback, {
    fields: [feedbackVotes.feedbackId],
    references: [userFeedback.id],
  }),
}));

export const feedbackCommentsRelations = relations(feedbackComments, ({ one }) => ({
  feedback: one(userFeedback, {
    fields: [feedbackComments.feedbackId],
    references: [userFeedback.id],
  }),
}));

export const feedbackNotificationsRelations = relations(feedbackNotifications, ({ one }) => ({
  feedback: one(userFeedback, {
    fields: [feedbackNotifications.feedbackId],
    references: [userFeedback.id],
  }),
}));

// ================================================================
// EXPORT ALL BATCH 3A TABLES
// ================================================================

export const batch3aTables = {
  animalArchetypes,
  userAnimalArchetypes,
  userFeedback,
  feedbackVotes,
  feedbackComments,
  feedbackNotifications,
  memories,
  memoryCollections,
};
