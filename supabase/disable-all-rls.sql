-- Disable RLS on all tables to get the MVP working
-- We'll re-enable with proper policies later

alter table daily_logs disable row level security;
alter table goals disable row level security;
alter table key_results disable row level security;
alter table weekly_reviews disable row level security;
alter table investor_updates disable row level security;
alter table integration_counters disable row level security;
