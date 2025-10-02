import { pgTable, uuid, text, timestamp, integer, boolean, date, numeric, jsonb, primaryKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ================================================================
// BATCH 3B FINAL - NIVEL 2 Y 3 DEPENDENCIAS (19 TABLAS)
// Completa la migración al 100% (73/73 tablas)
// ================================================================

// PERSONAL LIFE OS - NIVEL 2
export const personalEntryAreas = pgTable('personal_entry_areas', {
  entryId: uuid('entry_id').notNull(), // FK to personal_entries
  areaId: uuid('area_id').notNull(), // FK to life_areas
}, (table) => ({
  pk: primaryKey({ columns: [table.entryId, table.areaId] }),
}));

export const habitLogs = pgTable('habit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  habitId: uuid('habit_id'), // FK to habits
  userId: uuid('user_id'),
  date: date('date').notNull(),
  done: boolean('done').default(true),
  note: text('note'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ROUTINES SYSTEM - NIVEL 2
export const routineSteps = pgTable('routine_steps', {
  id: uuid('id').primaryKey().defaultRandom(),
  routineId: uuid('routine_id'), // FK to routines
  orderIndex: integer('order_index').notNull(),
  prompt: text('prompt').notNull(),
  placeholder: text('placeholder'),
  requiresAnswer: boolean('requires_answer').default(true),
  stepType: text('step_type').default('text'),
});

export const routineRuns = pgTable('routine_runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  routineId: uuid('routine_id'), // FK to routines
  userId: uuid('user_id'),
  date: date('date').notNull(),
  answers: jsonb('answers').default({}),
  completedAt: timestamp('completed_at', { withTimezone: true }).defaultNow(),
});

export const routineLogs = pgTable('routine_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  routineId: uuid('routine_id').notNull(), // FK to routines
  userId: uuid('user_id').notNull(),
  date: date('date').notNull(),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  durationMinutes: integer('duration_minutes'),
  completionRate: numeric('completion_rate').default('0'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// LEARNING SYSTEM - NIVEL 2
export const highlights = pgTable('highlights', {
  id: uuid('id').primaryKey().defaultRandom(),
  itemId: uuid('item_id'), // FK to learning_items
  userId: uuid('user_id'),
  text: text('text').notNull(),
  note: text('note'),
  pageNumber: integer('page_number'),
  location: text('location'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const challengeProgress = pgTable('challenge_progress', {
  id: uuid('id').primaryKey().defaultRandom(),
  challengeId: uuid('challenge_id'), // FK to challenges
  userId: uuid('user_id'),
  day: integer('day').notNull(),
  date: date('date').notNull(),
  done: boolean('done').default(false),
  note: text('note'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// MEMORIES SYSTEM - NIVEL 2
export const memoryPhotos = pgTable('memory_photos', {
  id: uuid('id').primaryKey().defaultRandom(),
  memoryId: uuid('memory_id').notNull(), // FK to memories
  userId: uuid('user_id').notNull(),
  fileName: text('file_name').notNull(),
  filePath: text('file_path').notNull(),
  fileSize: integer('file_size'),
  mimeType: text('mime_type'),
  width: integer('width'),
  height: integer('height'),
  caption: text('caption'),
  isCover: boolean('is_cover').default(false),
  uploadDate: timestamp('upload_date', { withTimezone: true }).defaultNow(),
});

// BOOKS SYSTEM - NIVEL 2
export const readingProgress = pgTable('reading_progress', {
  id: uuid('id').primaryKey().defaultRandom(),
  bookId: uuid('book_id').notNull(), // FK to books
  userId: uuid('user_id').notNull(),
  currentPage: integer('current_page').default(0),
  progressPercentage: numeric('progress_percentage').default('0'),
  readingSessionMinutes: integer('reading_session_minutes').default(0),
  notes: text('notes'),
  moodRating: integer('mood_rating'),
  comprehensionRating: integer('comprehension_rating'),
  date: date('date').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const bookHighlights = pgTable('book_highlights', {
  id: uuid('id').primaryKey().defaultRandom(),
  bookId: uuid('book_id').notNull(), // FK to books
  userId: uuid('user_id').notNull(),
  pageNumber: integer('page_number'),
  chapter: text('chapter'),
  highlightText: text('highlight_text').notNull(),
  personalNote: text('personal_note'),
  highlightType: text('highlight_type').default('quote'),
  isPublic: boolean('is_public').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const bookDonations = pgTable('book_donations', {
  id: uuid('id').primaryKey().defaultRandom(),
  bookId: uuid('book_id').notNull(), // FK to books
  donorUserId: uuid('donor_user_id'),
  donorEmail: text('donor_email'),
  donorName: text('donor_name'),
  amount: numeric('amount').notNull(),
  currency: text('currency').default('EUR'),
  message: text('message'),
  isAnonymous: boolean('is_anonymous').default(false),
  paymentStatus: text('payment_status').default('pending'),
  paymentMethod: text('payment_method'),
  paymentReference: text('payment_reference'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
});

export const bookReviews = pgTable('book_reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  bookId: uuid('book_id').notNull(), // FK to books
  userId: uuid('user_id').notNull(),
  rating: integer('rating').notNull(),
  reviewText: text('review_text'),
  wouldRecommend: boolean('would_recommend'),
  readingDifficulty: integer('reading_difficulty'),
  keyLearnings: text('key_learnings').array(),
  isPublic: boolean('is_public').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const readingListBooks = pgTable('reading_list_books', {
  id: uuid('id').primaryKey().defaultRandom(),
  readingListId: uuid('reading_list_id').notNull(), // FK to reading_lists
  bookId: uuid('book_id').notNull(), // FK to books
  orderIndex: integer('order_index').default(0),
  addedAt: timestamp('added_at', { withTimezone: true }).defaultNow(),
});

// PEOPLE SYSTEM - NIVEL 2
export const interactions = pgTable('interactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  personId: uuid('person_id').notNull(), // FK to people
  userId: uuid('user_id').notNull(),
  interactionType: text('interaction_type').notNull(),
  title: text('title'),
  description: text('description'),
  interactionDate: date('interaction_date').notNull(),
  durationMinutes: integer('duration_minutes'),
  location: text('location'),
  moodRating: integer('mood_rating'),
  importanceLevel: integer('importance_level').default(3),
  followUpNeeded: boolean('follow_up_needed').default(false),
  followUpDate: date('follow_up_date'),
  followUpNotes: text('follow_up_notes'),
  attachments: jsonb('attachments').default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const contactReminders = pgTable('contact_reminders', {
  id: uuid('id').primaryKey().defaultRandom(),
  personId: uuid('person_id').notNull(), // FK to people
  userId: uuid('user_id').notNull(),
  reminderDate: date('reminder_date').notNull(),
  reminderType: text('reminder_type').default('contact'),
  title: text('title').notNull(),
  description: text('description'),
  isCompleted: boolean('is_completed').default(false),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const peopleGroupMembers = pgTable('people_group_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  personId: uuid('person_id').notNull(), // FK to people
  groupId: uuid('group_id').notNull(), // FK to people_groups
  addedAt: timestamp('added_at', { withTimezone: true }).defaultNow(),
});

export const peopleInteractions = pgTable('people_interactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  personId: uuid('person_id'), // FK to people_contacts
  userId: uuid('user_id'),
  date: date('date').notNull(),
  type: text('type').default('other'),
  notesMd: text('notes_md'),
  sentiment: integer('sentiment'),
  durationMinutes: integer('duration_minutes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// NIVEL 3 - DEPENDENCIAS PROFUNDAS
export const cardLearningProgress = pgTable('card_learning_progress', {
  id: uuid('id').primaryKey().defaultRandom(),
  cardId: uuid('card_id').notNull(), // FK to flashcards
  userId: uuid('user_id').notNull(),
  learningStage: text('learning_stage').default('new'),
  nextReviewDate: date('next_review_date').notNull(),
  totalReviews: integer('total_reviews').default(0),
  totalCorrect: integer('total_correct').default(0),
  easeFactor: numeric('ease_factor').default('2.50'),
  intervalDays: integer('interval_days').default(1),
  repetitions: integer('repetitions').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const routineStepLogs = pgTable('routine_step_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  routineLogId: uuid('routine_log_id').notNull(), // FK to routine_logs
  stepId: uuid('step_id').notNull(), // FK to routine_steps
  completed: boolean('completed').default(false),
  durationMinutes: integer('duration_minutes'),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const memoryCollectionItems = pgTable('memory_collection_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  collectionId: uuid('collection_id').notNull(), // FK to memory_collections
  memoryId: uuid('memory_id').notNull(), // FK to memories
  addedAt: timestamp('added_at', { withTimezone: true }).defaultNow(),
});

// ================================================================
// EXPORT ALL BATCH 3B TABLES
// ================================================================

export const batch3bTables = {
  personalEntryAreas,
  habitLogs,
  routineSteps,
  routineRuns,
  routineLogs,
  highlights,
  challengeProgress,
  memoryPhotos,
  readingProgress,
  bookHighlights,
  bookDonations,
  bookReviews,
  readingListBooks,
  interactions,
  contactReminders,
  peopleGroupMembers,
  peopleInteractions,
  cardLearningProgress,
  routineStepLogs,
  memoryCollectionItems,
};
