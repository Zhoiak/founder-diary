# Founder Diary - Deployment Guide

## 🚀 Quick Deployment Checklist

### 1. Prerequisites Setup
- [ ] Node.js 18+ installed
- [ ] Supabase account created
- [ ] Vercel account (for deployment)
- [ ] OpenAI API key (optional)
- [ ] PostHog account (optional)

### 2. Supabase Setup

1. **Create Project**
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Note your project URL and anon key

2. **Database Setup**
   - Go to SQL Editor in Supabase dashboard
   - Run `supabase/schema.sql` (creates all tables and RLS policies)
   - Optionally run `supabase/seed.sql` (adds demo data - update user IDs first)

3. **Authentication Setup**
   - Go to Authentication > Settings
   - Add site URL: `https://your-domain.vercel.app`
   - Enable Email authentication
   - Configure OAuth providers (Google, GitHub) if desired

### 3. Environment Variables

Create `.env.local` with:

```bash
# Required
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional (enables AI features)
OPENAI_API_KEY=your_openai_key

# Optional (enables analytics)
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

### 4. Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

### 5. Production Deployment

#### Option A: Vercel (Recommended)

1. Push code to GitHub
2. Connect repo to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

#### Option B: Manual Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

### 6. Post-Deployment Setup

1. **Update Supabase URLs**
   - Add production URL to Supabase Auth settings
   - Update OAuth redirect URLs

2. **Test Core Features**
   - [ ] Sign up/sign in works
   - [ ] Can create projects
   - [ ] Can create daily logs
   - [ ] Can set goals and update progress
   - [ ] Analytics display correctly
   - [ ] Export functionality works

3. **Optional Integrations**
   - Configure PostHog for analytics
   - Set up OpenAI for AI summaries
   - Test email delivery

## 🔧 Configuration Options

### Database Customization

Modify `supabase/schema.sql` to:
- Add custom fields to tables
- Create additional tables
- Modify RLS policies

### UI Customization

- Update `src/app/globals.css` for styling
- Modify components in `src/components/ui/`
- Change theme colors in `tailwind.config.js`

### Feature Toggles

Control features via environment variables:
- `OPENAI_API_KEY` - Enables AI summaries
- `NEXT_PUBLIC_POSTHOG_KEY` - Enables analytics
- Custom feature flags in code

## 🐛 Troubleshooting

### Common Issues

**"Unauthorized" errors**
- Check Supabase URL and keys
- Verify RLS policies are applied
- Ensure user has project membership

**AI summaries not working**
- Verify OpenAI API key
- Check API key has credits
- Fallback summaries should still work

**Authentication issues**
- Check site URL in Supabase settings
- Verify OAuth provider configuration
- Clear browser cache/cookies

**Build errors**
- Run `npm install` to update dependencies
- Check TypeScript errors
- Verify all environment variables

### Performance Optimization

1. **Database**
   - Add indexes for frequently queried columns
   - Optimize RLS policies
   - Use connection pooling

2. **Frontend**
   - Enable Next.js caching
   - Optimize images with next/image
   - Use React.memo for expensive components

3. **API**
   - Add request caching
   - Implement rate limiting
   - Use database transactions

## 📊 Monitoring

### Built-in Analytics
- Supabase dashboard for database metrics
- Vercel analytics for performance
- PostHog for user behavior (if configured)

### Custom Monitoring
- Add error tracking (Sentry)
- Set up uptime monitoring
- Monitor API response times

## 🔐 Security Checklist

- [ ] RLS policies properly configured
- [ ] Service role key not exposed to client
- [ ] HTTPS enabled in production
- [ ] OAuth providers configured securely
- [ ] Rate limiting implemented
- [ ] Input validation on all endpoints
- [ ] SQL injection protection via Supabase

## 📈 Scaling Considerations

### Database Scaling
- Monitor connection usage
- Consider read replicas for analytics
- Implement data archiving for old logs

### Application Scaling
- Use Vercel Edge Functions for better performance
- Implement caching strategies
- Consider CDN for static assets

### Cost Optimization
- Monitor Supabase usage
- Optimize OpenAI API calls
- Use Vercel analytics to track usage

---

## 🎯 Production Readiness Score

Your app includes:
- ✅ Authentication & authorization
- ✅ Database with RLS security
- ✅ API validation with Zod
- ✅ Error handling & user feedback
- ✅ Responsive UI design
- ✅ Export functionality
- ✅ Analytics & insights
- ✅ AI-powered features (optional)
- ✅ Comprehensive documentation
- ✅ Testing setup

**Ready for production deployment! 🚀**
