import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://founder_user:FounderDiary2024!@localhost:5432/founder_diary',
  },
  verbose: true,
  strict: true,
});
