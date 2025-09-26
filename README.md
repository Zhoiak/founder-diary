# Founder Diary

A production-ready MVP for solo founders to maintain daily logs, weekly reviews, OKR progress tracking, and investor updates. Built with Next.js 14, Supabase, and AI-powered insights.

## 🚀 Features

### Core Features
- **Multi-project support**: Create and manage multiple projects
- **Daily logs**: Rich markdown editor with tags, mood tracking, and time logging
- **Weekly reviews**: AI-generated summaries from daily logs
- **Goals & OKRs**: Set objectives and track key results
- **Investor updates**: Monthly reports with public sharing capability
- **Analytics**: Streak tracking, time spent, and progress charts
- **Export**: Download all data as organized Markdown files

### Authentication & Security
- Magic link and OAuth (Google/GitHub) authentication via Supabase
- Row-level security (RLS) for data protection
- Project-based access control

### AI-Powered Insights
- Automatic summarization of daily logs into weekly reviews
- Generated investor update drafts from logs and metrics
- Fallback summaries when OpenAI API is unavailable

## 🛠 Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, TailwindCSS
- **UI Components**: shadcn/ui, Radix UI
- **Backend**: Next.js API Routes, Supabase (PostgreSQL + Auth + RLS)
- **AI**: OpenAI GPT-3.5-turbo (optional, with fallbacks)
- **Analytics**: PostHog (optional)
- **Charts**: Recharts
- **Deployment**: Vercel + Supabase Cloud

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- OpenAI API key (optional, for AI features)
- PostHog account (optional, for analytics)

## ⚡ Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd founder-diary
npm install
```

### 2. Environment Setup

Copy the environment template:

```bash
cp .env.local.example .env.local
```

Fill in your environment variables in `.env.local`:

```bash
# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI (optional - enables AI summaries)
OPENAI_API_KEY=your_openai_api_key

# PostHog (optional - enables analytics)
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_project_api_key
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

### 3. Database Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. In your Supabase dashboard, go to the SQL Editor
3. Run the schema file: `supabase/schema.sql`
4. Optionally run the seed file: `supabase/seed.sql` (update user IDs first)

### 4. Configure Authentication

In your Supabase dashboard:
1. Go to Authentication > Settings
2. Add your site URL: `http://localhost:3000`
3. Configure OAuth providers (Google, GitHub) if desired
4. Enable email authentication

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign up!

## 🗄 Database Schema

The app uses the following main tables:

- `projects` - User projects
- `project_members` - Project access control
- `daily_logs` - Daily entries with markdown content
- `goals` - Objectives and OKRs
- `key_results` - Measurable outcomes for goals
- `weekly_reviews` - AI-generated weekly summaries
- `investor_updates` - Monthly reports with public sharing
- `integration_counters` - External metrics (GitHub, etc.)

All tables have Row Level Security (RLS) enabled for data protection.

## 🔌 API Endpoints

### Projects
- `GET /api/projects` - List user's projects
- `POST /api/projects` - Create new project

### Daily Logs
- `GET /api/logs?projectId=uuid` - List logs for project
- `POST /api/logs` - Create new log
- `PATCH /api/logs/[id]` - Update log
- `DELETE /api/logs/[id]` - Delete log

### Goals & OKRs
- `GET /api/goals?projectId=uuid` - List goals with key results
- `POST /api/goals` - Create goal with key results
- `PATCH /api/key-results/[id]` - Update key result progress

### Reviews & Updates
- `POST /api/weekly/review` - Generate weekly review
- `POST /api/investor/update` - Generate investor update
- `GET /api/public/update/[slug]` - Public investor update

### Export
- `POST /api/export/markdown` - Export project data as ZIP

## 🎨 UI Structure

```
src/
├── app/
│   ├── (protected)/          # Protected routes (requires auth)
│   │   ├── page.tsx         # Dashboard
│   │   └── layout.tsx       # Auth guard
│   ├── auth/                # Authentication pages
│   ├── api/                 # API route handlers
│   └── providers.tsx        # Global providers
├── components/ui/           # shadcn/ui components
├── lib/
│   ├── supabase/           # Supabase client/server helpers
│   ├── ai.ts               # OpenAI integration
│   ├── validations.ts      # Zod schemas
│   └── slug.ts             # Utility functions
└── supabase/               # Database schema and seeds
```

## 🚀 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Connect your repo to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Supabase Production Setup

1. Update your Supabase project settings
2. Add your production URL to allowed origins
3. Configure OAuth redirect URLs for production
4. Update RLS policies if needed

## 🧪 Testing

### Run Tests (when implemented)

```bash
# Unit tests
npm run test

# E2E tests with Playwright
npm run test:e2e
```

### Manual Testing Checklist

- [ ] Sign up/sign in with magic link
- [ ] Sign in with OAuth (Google/GitHub)
- [ ] Create and list projects
- [ ] Create daily logs with markdown
- [ ] Generate weekly reviews
- [ ] Set goals and update key results
- [ ] Generate investor updates
- [ ] Share public investor update
- [ ] Export project data

## 🔧 Development

### Adding New Features

1. Define Zod validation schemas in `src/lib/validations.ts`
2. Create API routes in `src/app/api/`
3. Add UI components and pages
4. Update database schema if needed
5. Add tests

### Database Migrations

When updating the schema:
1. Modify `supabase/schema.sql`
2. Test changes in development
3. Apply to production via Supabase dashboard

## 📊 Analytics & Monitoring

### PostHog Integration

The app tracks key events:
- `log_created` - Daily log entries
- `weekly_generated` - Weekly review generation
- `investor_update_published` - Public investor updates
- `streak_day` - Daily logging streaks

### Performance Monitoring

- Next.js built-in analytics
- Supabase dashboard metrics
- Vercel deployment analytics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

MIT License - see LICENSE file for details.

## 🆘 Support

### Common Issues

**Authentication not working?**
- Check Supabase URL and keys
- Verify site URL in Supabase settings
- Ensure OAuth providers are configured

**AI summaries not generating?**
- Check OpenAI API key
- Verify API key has sufficient credits
- Fallback summaries should still work

**Database errors?**
- Verify RLS policies are applied
- Check user has project membership
- Ensure schema is up to date

### Getting Help

- Check the [Issues](https://github.com/your-repo/issues) page
- Review Supabase and Next.js documentation
- Join the community discussions

---

Built with ❤️ for founders who want to track their journey and share their progress.
