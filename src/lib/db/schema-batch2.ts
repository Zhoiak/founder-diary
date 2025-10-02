import { pgTable, uuid, text, timestamp, integer, boolean, date, numeric, jsonb, primaryKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ================================================================
// BATCH 2 - NIVEL 1 DEPENDENCIAS (20 TABLAS)
// Todas dependen directamente de projects
// ================================================================

// PROJECT MANAGEMENT
export const projectMembers = pgTable('project_members', {
  projectId: uuid('project_id').notNull(),
  userId: uuid('user_id').notNull(),
  role: text('role').default('owner'),
  invitedAt: timestamp('invited_at', { withTimezone: true }),
  lastActivity: timestamp('last_activity', { withTimezone: true }).defaultNow(),
  joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.projectId, table.userId] }),
}));

export const keyResults = pgTable('key_results', {
  id: uuid('id').primaryKey().defaultRandom(),
  goalId: uuid('goal_id'), // FK to goals
  name: text('name').notNull(),
  target: numeric('target'),
  current: numeric('current').default('0'),
  unit: text('unit'),
});

export const integrationCounters = pgTable('integration_counters', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id'), // FK to projects
  periodStart: date('period_start'),
  periodEnd: date('period_end'),
  githubPrs: integer('github_prs').default(0),
  githubIssues: integer('github_issues').default(0),
  vercelDeploys: integer('vercel_deploys').default(0),
  calendarEvents: integer('calendar_events').default(0),
});

// PRODUCT MANAGEMENT
export const assumptions = pgTable('assumptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id'), // FK to projects
  userId: uuid('user_id'),
  hypothesis: text('hypothesis').notNull(),
  testPlanMd: text('test_plan_md'),
  resultMd: text('result_md'),
  status: text('status').default('untested'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const risks = pgTable('risks', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id'), // FK to projects
  userId: uuid('user_id'),
  title: text('title').notNull(),
  category: text('category'),
  probability: integer('probability'),
  impact: integer('impact'),
  mitigationMd: text('mitigation_md'),
  owner: uuid('owner'),
  status: text('status').default('open'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const features = pgTable('features', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id'), // FK to projects
  userId: uuid('user_id'),
  title: text('title').notNull(),
  descriptionMd: text('description_md'),
  reach: numeric('reach').default('0'),
  impact: numeric('impact').default('0'),
  confidence: numeric('confidence').default('0'),
  effort: numeric('effort').default('1'),
  status: text('status').default('idea'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const streakFreezes = pgTable('streak_freezes', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id'), // FK to projects
  userId: uuid('user_id'),
  date: date('date').notNull(),
  reason: text('reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// PEOPLE & CONTACTS
export const peopleContacts = pgTable('people_contacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id'), // FK to projects
  userId: uuid('user_id'),
  name: text('name').notNull(),
  aka: text('aka'),
  tags: text('tags').array().default([]),
  birthday: date('birthday'),
  timezone: text('timezone').default('UTC'),
  email: text('email'),
  phone: text('phone'),
  notesMd: text('notes_md'),
  relationshipType: text('relationship_type'),
  importance: integer('importance').default(3),
  lastContact: date('last_contact'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const people = pgTable('people', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  projectId: uuid('project_id'), // FK to projects
  firstName: text('first_name').notNull(),
  lastName: text('last_name'),
  fullName: text('full_name'),
  nickname: text('nickname'),
  email: text('email'),
  phone: text('phone'),
  birthday: date('birthday'),
  relationshipType: text('relationship_type').default('friend'),
  relationshipCloseness: integer('relationship_closeness').default(3),
  company: text('company'),
  jobTitle: text('job_title'),
  location: text('location'),
  address: text('address'),
  socialLinks: jsonb('social_links').default({}),
  avatarUrl: text('avatar_url'),
  notes: text('notes'),
  tags: text('tags').array(),
  isFavorite: boolean('is_favorite').default(false),
  isArchived: boolean('is_archived').default(false),
  lastContactDate: date('last_contact_date'),
  contactFrequencyDays: integer('contact_frequency_days').default(30),
  nextContactReminder: date('next_contact_reminder'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const peopleGroups = pgTable('people_groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  projectId: uuid('project_id'), // FK to projects
  name: text('name').notNull(),
  description: text('description'),
  color: text('color').default('#3B82F6'),
  icon: text('icon').default('👥'),
  isSystemGroup: boolean('is_system_group').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// LEARNING & KNOWLEDGE
export const learningItems = pgTable('learning_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id'), // FK to projects
  userId: uuid('user_id'),
  kind: text('kind').notNull(),
  title: text('title').notNull(),
  author: text('author'),
  sourceUrl: text('source_url'),
  isbn: text('isbn'),
  status: text('status').default('want_to_read'),
  rating: integer('rating'),
  startedAt: date('started_at'),
  finishedAt: date('finished_at'),
  notesMd: text('notes_md'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const flashcards = pgTable('flashcards', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id'), // FK to projects
  userId: uuid('user_id'),
  front: text('front').notNull(),
  back: text('back').notNull(),
  sourceHighlightId: uuid('source_highlight_id'), // FK to highlights
  deckName: text('deck_name').default('General'),
  deckId: uuid('deck_id'),
  frontContent: text('front_content'),
  backContent: text('back_content'),
  hint: text('hint'),
  cardOrder: integer('card_order').default(0),
  isActive: boolean('is_active').default(true),
  lastReviewed: timestamp('last_reviewed', { withTimezone: true }),
  nextReview: timestamp('next_review', { withTimezone: true }),
  intervalDays: integer('interval_days').default(1),
  easeFactor: numeric('ease_factor').default('2.5'),
  repetitions: integer('repetitions').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// BOOKS & READING
export const books = pgTable('books', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  projectId: uuid('project_id'), // FK to projects
  title: text('title').notNull(),
  author: text('author').notNull(),
  isbn: text('isbn'),
  description: text('description'),
  coverImageUrl: text('cover_image_url'),
  pages: integer('pages'),
  language: text('language').default('es'),
  genre: text('genre'),
  publisher: text('publisher'),
  publishedYear: integer('published_year'),
  purchaseUrl: text('purchase_url'),
  estimatedPrice: numeric('estimated_price'),
  actualPrice: numeric('actual_price'),
  currency: text('currency').default('EUR'),
  priorityLevel: integer('priority_level').default(5),
  readingStatus: text('reading_status').default('wishlist'),
  isPublic: boolean('is_public').default(false),
  allowCrowdfunding: boolean('allow_crowdfunding').default(false),
  crowdfundingGoal: numeric('crowdfunding_goal'),
  crowdfundingRaised: numeric('crowdfunding_raised').default('0'),
  crowdfundingDeadline: date('crowdfunding_deadline'),
  crowdfundingMessage: text('crowdfunding_message'),
  tags: text('tags').array(),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  startedReadingAt: timestamp('started_reading_at', { withTimezone: true }),
  completedReadingAt: timestamp('completed_reading_at', { withTimezone: true }),
});

export const readingLists = pgTable('reading_lists', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  projectId: uuid('project_id'), // FK to projects
  name: text('name').notNull(),
  description: text('description'),
  isPublic: boolean('is_public').default(false),
  color: text('color').default('#3B82F6'),
  icon: text('icon').default('📚'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// PERSONAL LIFE OS
export const journalPrompts = pgTable('journal_prompts', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id'), // FK to projects
  userId: uuid('user_id'),
  key: text('key').notNull(),
  textMd: text('text_md').notNull(),
  areaId: uuid('area_id'), // FK to life_areas
  frequency: text('frequency').default('daily'),
  active: boolean('active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const affirmations = pgTable('affirmations', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id'), // FK to projects
  userId: uuid('user_id'),
  textMd: text('text_md').notNull(),
  areaId: uuid('area_id'), // FK to life_areas
  active: boolean('active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const challenges = pgTable('challenges', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id'), // FK to projects
  userId: uuid('user_id'),
  title: text('title').notNull(),
  description: text('description'),
  days: integer('days').default(30),
  startDate: date('start_date'),
  areaId: uuid('area_id'), // FK to life_areas
  active: boolean('active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const wellbeingMetrics = pgTable('wellbeing_metrics', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id'), // FK to projects
  userId: uuid('user_id'),
  date: date('date').notNull(),
  metricType: text('metric_type').notNull(),
  value: numeric('value').notNull(),
  unit: text('unit'),
  source: text('source').default('manual'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// COLLABORATION
export const projectInvitations = pgTable('project_invitations', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').notNull(), // FK to projects
  invitedBy: uuid('invited_by').notNull(),
  invitedEmail: text('invited_email').notNull(),
  role: text('role').notNull().default('member'),
  status: text('status').notNull().default('pending'),
  invitationToken: uuid('invitation_token').notNull().defaultRandom(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// UTILITIES
export const staticNotes = pgTable('static_notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  projectId: uuid('project_id'), // FK to projects
  moduleName: text('module_name').notNull(),
  noteType: text('note_type').default('reminder'),
  title: text('title'),
  content: text('content').notNull(),
  color: text('color').default('#FEF3C7'),
  icon: text('icon').default('📝'),
  positionX: integer('position_x').default(0),
  positionY: integer('position_y').default(0),
  isPinned: boolean('is_pinned').default(true),
  isVisible: boolean('is_visible').default(true),
  priority: integer('priority').default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ================================================================
// EXPORT ALL BATCH 2 TABLES
// ================================================================

export const batch2Tables = {
  projectMembers,
  keyResults,
  integrationCounters,
  assumptions,
  risks,
  features,
  streakFreezes,
  peopleContacts,
  people,
  peopleGroups,
  learningItems,
  flashcards,
  books,
  readingLists,
  journalPrompts,
  affirmations,
  challenges,
  wellbeingMetrics,
  projectInvitations,
  staticNotes,
};
