-- Seed data for Founder Diary
-- Run this after schema.sql and after creating a user account

-- Insert demo project (replace 'your-user-id' with actual auth.users.id)
-- You can get your user ID by running: SELECT id FROM auth.users WHERE email = 'your-email@example.com';

-- Example project (update the owner UUID to match your user)
INSERT INTO projects (id, owner, name, slug, created_at) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'your-user-id-here', 'My SaaS Startup', 'my-saas-startup', now() - interval '14 days');

-- Add project membership
INSERT INTO project_members (project_id, user_id, role) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'your-user-id-here', 'owner');

-- Sample daily logs over the past 2 weeks
INSERT INTO daily_logs (project_id, user_id, date, title, content_md, tags, mood, time_spent_minutes, ai_summary, created_at) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'your-user-id-here', current_date - 13, 'Project kickoff and market research', 
   '# Today''s Progress\n\n- Completed competitor analysis\n- Defined target customer persona\n- Started wireframes for MVP\n\n## Key Insights\n- Market size is $2.5B and growing\n- Main competitors lack mobile-first approach\n- Potential early adopters identified\n\n## Next Steps\n- Finish wireframes\n- Start technical architecture planning', 
   ARRAY['research', 'planning', 'mvp'], 4, 480, 'Productive day focusing on market research and competitor analysis. Identified key opportunities in mobile-first approach.', now() - interval '13 days'),
   
  ('550e8400-e29b-41d4-a716-446655440000', 'your-user-id-here', current_date - 12, 'Technical architecture and team planning', 
   '# Development Progress\n\n- Finalized tech stack: Next.js, Supabase, Vercel\n- Created project repository\n- Set up development environment\n\n## Challenges\n- Need to decide on payment processor\n- Database schema needs refinement\n\n## Wins\n- Found potential co-founder with complementary skills\n- Got positive feedback from 3 potential customers', 
   ARRAY['development', 'team', 'feedback'], 5, 420, 'Great progress on technical foundation. Positive customer feedback validates the direction.', now() - interval '12 days'),
   
  ('550e8400-e29b-41d4-a716-446655440000', 'your-user-id-here', current_date - 11, 'MVP development begins', 
   '# Coding Marathon\n\n- Set up authentication system\n- Created user dashboard mockups\n- Implemented basic CRUD operations\n\n## Blockers\n- Third-party API rate limits causing issues\n- Need to optimize database queries\n\n## Metrics\n- 15 commits pushed\n- 3 new features completed\n- 2 bugs fixed', 
   ARRAY['development', 'mvp', 'coding'], 3, 540, 'Solid development progress despite some technical blockers. MVP taking shape.', now() - interval '11 days'),
   
  ('550e8400-e29b-41d4-a716-446655440000', 'your-user-id-here', current_date - 10, 'User testing and feedback collection', 
   '# User Research Day\n\n- Conducted 5 user interviews\n- Tested initial prototype with beta users\n- Collected detailed feedback and feature requests\n\n## Key Feedback\n- Users love the clean interface\n- Need better onboarding flow\n- Mobile experience needs work\n\n## Action Items\n- Redesign onboarding\n- Prioritize mobile responsiveness\n- Add tutorial tooltips', 
   ARRAY['user-testing', 'feedback', 'ux'], 4, 360, 'Valuable user feedback session. Clear direction for UX improvements identified.', now() - interval '10 days'),
   
  ('550e8400-e29b-41d4-a716-446655440000', 'your-user-id-here', current_date - 9, 'Fundraising preparation', 
   '# Investor Prep\n\n- Updated pitch deck with latest metrics\n- Prepared financial projections\n- Researched potential investors\n\n## Progress\n- 12-slide pitch deck completed\n- 3-year financial model built\n- List of 20 target investors compiled\n\n## Next Week\n- Start reaching out to warm connections\n- Practice pitch presentation\n- Prepare for due diligence questions', 
   ARRAY['fundraising', 'pitch', 'investors'], 4, 300, 'Fundraising materials prepared. Ready to start investor outreach next week.', now() - interval '9 days'),
   
  ('550e8400-e29b-41d4-a716-446655440000', 'your-user-id-here', current_date - 8, 'Product launch preparation', 
   '# Launch Week Prep\n\n- Finalized landing page copy\n- Set up analytics and tracking\n- Prepared social media campaign\n\n## Launch Checklist\n- ✅ Product Hunt submission ready\n- ✅ Press kit prepared\n- ✅ Customer support system set up\n- ⏳ Final bug testing in progress\n\n## Excitement Level: 📈', 
   ARRAY['launch', 'marketing', 'preparation'], 5, 450, 'Launch preparations on track. High energy and excitement for the big day.', now() - interval '8 days'),
   
  ('550e8400-e29b-41d4-a716-446655440000', 'your-user-id-here', current_date - 7, 'Week 1 launch results', 
   '# Launch Week Results\n\n## Metrics\n- 1,247 signups in first week\n- 23% conversion to paid plans\n- 4.2/5 average user rating\n- Featured on Product Hunt (#3 of the day)\n\n## Challenges\n- Server scaling issues on day 2\n- Customer support backlog\n- Some payment processing bugs\n\n## Lessons Learned\n- Always over-provision servers for launch\n- Have support team ready from day 1\n- Test payment flows extensively', 
   ARRAY['launch', 'metrics', 'lessons'], 4, 600, 'Successful launch week with strong metrics. Some operational challenges but overall positive outcome.', now() - interval '7 days'),
   
  ('550e8400-e29b-41d4-a716-446655440000', 'your-user-id-here', current_date - 6, 'Post-launch optimization', 
   '# Optimization Focus\n\n- Fixed critical payment bugs\n- Improved onboarding conversion by 15%\n- Added requested features from user feedback\n\n## New Features\n- Dark mode toggle\n- Export functionality\n- Mobile app beta\n\n## Metrics Update\n- Monthly recurring revenue: $3,400\n- Churn rate: 8%\n- Net Promoter Score: 42', 
   ARRAY['optimization', 'features', 'metrics'], 4, 480, 'Strong post-launch momentum. Revenue growing and user satisfaction improving.', now() - interval '6 days'),
   
  ('550e8400-e29b-41d4-a716-446655440000', 'your-user-id-here', current_date - 5, 'Team expansion planning', 
   '# Growing the Team\n\n- Posted job descriptions for 2 developers\n- Interviewed potential marketing hire\n- Set up HR processes and employee handbook\n\n## Hiring Progress\n- 47 developer applications received\n- 3 promising candidates identified\n- 1 marketing specialist ready to start\n\n## Culture Building\n- Defined company values\n- Planned team retreat\n- Set up remote work policies', 
   ARRAY['hiring', 'team', 'culture'], 3, 420, 'Team expansion in progress. Good candidate pipeline and culture foundation being built.', now() - interval '5 days'),
   
  ('550e8400-e29b-41d4-a716-446655440000', 'your-user-id-here', current_date - 4, 'Investor meetings week', 
   '# Investor Pitch Week\n\n- 8 investor meetings scheduled\n- 3 follow-up meetings booked\n- 2 term sheets received\n\n## Meeting Highlights\n- Acme Ventures very interested\n- Beta Capital wants to lead Series A\n- Several angels ready to participate\n\n## Key Questions Asked\n- Customer acquisition cost trends\n- Competitive differentiation\n- International expansion plans\n\n## Next Steps\n- Legal review of term sheets\n- Reference calls with portfolio companies\n- Final decision by end of week', 
   ARRAY['fundraising', 'investors', 'meetings'], 5, 540, 'Excellent investor interest with multiple term sheets. Strong validation of business model.', now() - interval '4 days'),
   
  ('550e8400-e29b-41d4-a716-446655440000', 'your-user-id-here', current_date - 3, 'Funding round closed', 
   '# 🎉 Series A Closed!\n\n## Deal Terms\n- $2.5M raised\n- Beta Capital leading\n- 3 strategic angels participating\n- 18 month runway secured\n\n## Celebration & Planning\n- Team dinner to celebrate\n- Updated hiring timeline\n- Accelerated product roadmap\n\n## Media Coverage\n- TechCrunch article published\n- 2 podcast interviews scheduled\n- Industry newsletter features\n\n## Feeling: Grateful and energized! 🚀', 
   ARRAY['fundraising', 'milestone', 'celebration'], 5, 360, 'Major milestone achieved! Series A funding secured with great investors and strong runway.', now() - interval '3 days'),
   
  ('550e8400-e29b-41d4-a716-446655440000', 'your-user-id-here', current_date - 2, 'Strategic planning session', 
   '# Q4 Planning\n\n- Quarterly OKRs defined\n- Product roadmap updated\n- Team expansion timeline set\n\n## Q4 Priorities\n1. Scale to 10,000 users\n2. Launch enterprise features\n3. Expand to 2 new markets\n4. Hire 5 team members\n\n## Resource Allocation\n- 60% product development\n- 25% sales & marketing\n- 15% operations & hiring\n\n## Risk Mitigation\n- Competitor analysis updated\n- Backup plans for key initiatives\n- Monthly board reporting cadence', 
   ARRAY['planning', 'strategy', 'okrs'], 4, 420, 'Comprehensive strategic planning completed. Clear roadmap and priorities set for Q4.', now() - interval '2 days'),
   
  ('550e8400-e29b-41d4-a716-446655440000', 'your-user-id-here', current_date - 1, 'Customer success focus', 
   '# Customer-Centric Day\n\n- Reviewed all customer feedback from past month\n- Implemented top 3 requested features\n- Launched customer success program\n\n## Customer Insights\n- 89% would recommend to others\n- Average session time increased 40%\n- Support ticket volume down 25%\n\n## New Initiatives\n- Weekly customer check-ins\n- User community forum\n- Customer advisory board\n\n## Quote of the Day\n"Your product has transformed how we work!" - Sarah, Enterprise Customer', 
   ARRAY['customer-success', 'feedback', 'community'], 5, 390, 'Strong customer focus paying off. High satisfaction scores and valuable feature improvements shipped.', now() - interval '1 day');

-- Sample goal with key results
INSERT INTO goals (id, project_id, user_id, objective, due_date, created_at) VALUES
  ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'your-user-id-here', 'Launch MVP and achieve product-market fit', current_date + 30, now() - interval '10 days');

INSERT INTO key_results (goal_id, name, target, current, unit) VALUES
  ('660e8400-e29b-41d4-a716-446655440001', 'Acquire paying customers', 100, 23, 'customers'),
  ('660e8400-e29b-41d4-a716-446655440001', 'Achieve monthly recurring revenue', 10000, 3400, 'USD'),
  ('660e8400-e29b-41d4-a716-446655440001', 'Maintain customer satisfaction score', 4.5, 4.2, 'rating');

-- Sample weekly review
INSERT INTO weekly_reviews (project_id, user_id, week_start, week_end, content_md, ai_summary, created_at) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'your-user-id-here', current_date - 13, current_date - 7, 
   '# Week of ' || to_char(current_date - 13, 'Mon DD') || ' - ' || to_char(current_date - 7, 'Mon DD') || '\n\n## Key Accomplishments\n- Completed market research and competitor analysis\n- Finalized technical architecture\n- Started MVP development\n- Conducted user interviews\n\n## Metrics\n- 15 commits pushed\n- 5 user interviews completed\n- 3 new features implemented\n\n## Challenges\n- API rate limiting issues\n- Database optimization needed\n- Mobile UX requires improvement\n\n## Next Week Focus\n- Complete MVP core features\n- Improve mobile experience\n- Prepare for beta testing\n\n## Mood: Productive and focused 💪', 
   'Strong week with significant progress on MVP development and valuable user research. Some technical challenges but overall positive momentum.', 
   now() - interval '6 days');

-- Sample investor update
INSERT INTO investor_updates (project_id, user_id, month, year, content_md, ai_summary, public_slug, is_public, created_at) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'your-user-id-here', extract(month from current_date)::int, extract(year from current_date)::int,
   '# Monthly Update - ' || to_char(current_date, 'Month YYYY') || '\n\n## Executive Summary\nStrong month with successful product launch and initial traction. Revenue growing, team expanding, and preparing for next funding round.\n\n## Key Metrics\n- **Monthly Recurring Revenue**: $3,400 (+127% MoM)\n- **Active Users**: 1,247 (+89% MoM)\n- **Customer Acquisition Cost**: $23\n- **Churn Rate**: 8%\n- **Net Promoter Score**: 42\n\n## Major Milestones\n- ✅ Successfully launched MVP\n- ✅ Featured on Product Hunt (#3 of the day)\n- ✅ Closed Series A funding ($2.5M)\n- ✅ Hired first marketing specialist\n\n## Product Updates\n- Added dark mode and export functionality\n- Improved onboarding conversion by 15%\n- Released mobile app beta\n- Fixed critical payment processing bugs\n\n## Team & Operations\n- Team size: 4 → 6 people\n- New hires: Marketing Specialist, 2 Developers\n- Established remote work policies\n- Set up customer success program\n\n## Financial Overview\n- Runway: 18 months\n- Burn rate: $45K/month\n- Revenue growth: 127% MoM\n- Cash position: Strong\n\n## Challenges & Risks\n- Scaling infrastructure for growth\n- Competitive pressure increasing\n- Need to optimize customer acquisition\n\n## Next Month Goals\n- Scale to 10,000 users\n- Launch enterprise features\n- Expand to 2 new markets\n- Complete team hiring\n\n## Ask\n- Introductions to enterprise customers\n- Feedback on international expansion strategy\n- Connections to potential strategic partners\n\n---\n*Thank you for your continued support and guidance!*',
   'Strong monthly performance with successful launch, funding closed, and significant revenue growth. Team expanding and preparing for next phase of scaling.',
   'monthly-update-' || extract(year from current_date) || '-' || lpad(extract(month from current_date)::text, 2, '0'),
   true,
   now() - interval '3 days');

-- Note: Remember to replace 'your-user-id-here' with your actual user ID from auth.users table
-- You can get it by running: SELECT id FROM auth.users WHERE email = 'your-email@example.com';
