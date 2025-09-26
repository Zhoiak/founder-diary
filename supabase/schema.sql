-- Supabase schema for Founder Diary
-- Enable required extensions
create extension if not exists pgcrypto;

-- projects a user owns
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references auth.users(id) on delete cascade,
  name text not null,
  slug text unique,
  created_at timestamptz default now()
);

-- membership (future multi-user). For MVP, insert owner as admin.
create table if not exists project_members (
  project_id uuid references projects(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text check (role in ('owner','admin','editor','viewer')) default 'owner',
  primary key (project_id, user_id)
);

-- daily logs
create table if not exists daily_logs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  date date not null,
  title text,
  content_md text,
  tags text[] default '{}',
  mood int check (mood between 1 and 5),
  time_spent_minutes int default 0,
  ai_summary text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- goals / OKRs
create table if not exists goals (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  objective text not null,
  due_date date,
  created_at timestamptz default now()
);

create table if not exists key_results (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid references goals(id) on delete cascade,
  name text not null,
  target numeric,
  current numeric default 0,
  unit text
);

-- weekly reviews
create table if not exists weekly_reviews (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  week_start date not null,
  week_end date not null,
  content_md text,
  ai_summary text,
  created_at timestamptz default now()
);

-- monthly investor updates
create table if not exists investor_updates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  month int check (month between 1 and 12),
  year int,
  content_md text,
  ai_summary text,
  public_slug text unique,
  is_public boolean default false,
  created_at timestamptz default now()
);

-- basic integration counters (optional MVP)
create table if not exists integration_counters (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  period_start date,
  period_end date,
  github_prs int default 0,
  github_issues int default 0,
  vercel_deploys int default 0,
  calendar_events int default 0
);

-- Updated timestamps trigger for daily_logs
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_daily_logs_updated on daily_logs;
create trigger trg_daily_logs_updated
before update on daily_logs
for each row execute procedure set_updated_at();

-- Row Level Security
alter table projects enable row level security;
alter table project_members enable row level security;
alter table daily_logs enable row level security;
alter table goals enable row level security;
alter table key_results enable row level security;
alter table weekly_reviews enable row level security;
alter table investor_updates enable row level security;
alter table integration_counters enable row level security;
-- Helper policy: membership exists
create or replace view user_project_memberships as
  select pm.project_id, pm.user_id, pm.role from project_members pm;

-- Projects policies
create policy "projects_read_member"
  on projects for select
  using (
    exists (
      select 1 from project_members pm
      where pm.project_id = projects.id and pm.user_id = auth.uid()
    )
  );

create policy "projects_insert_owner"
  on projects for insert
  with check (auth.uid() is not null);

create policy "projects_update_owner"
  on projects for update
  using (
    exists (
      select 1 from project_members pm
      where pm.project_id = projects.id and pm.user_id = auth.uid() and pm.role = 'owner'
    )
  );

-- Project members policies
create policy "project_members_read_member"
  on project_members for select
  using (user_id = auth.uid() or project_id in (
    select project_id from project_members where user_id = auth.uid()
  ));

create policy "project_members_insert_owner"
  on project_members for insert
  with check (
    exists (
      select 1 from project_members pm
      where pm.project_id = project_members.project_id and pm.user_id = auth.uid() and pm.role = 'owner'
    ) or not exists (
      select 1 from project_members pm where pm.project_id = project_members.project_id
    )
  );

-- Daily logs policies
create policy "daily_logs_crud_member"
  on daily_logs for all
  using (
    exists (
      select 1 from project_members pm
      where pm.project_id = daily_logs.project_id and pm.user_id = auth.uid()
    )
  );

-- Goals policies
create policy "goals_crud_member"
  on goals for all
  using (
    exists (
      select 1 from project_members pm
      where pm.project_id = goals.project_id and pm.user_id = auth.uid()
    )
  );

-- Key results policies
create policy "key_results_crud_member"
  on key_results for all
  using (
    exists (
      select 1 from goals g
      join project_members pm on pm.project_id = g.project_id
      where g.id = key_results.goal_id and pm.user_id = auth.uid()
    )
  );

-- Weekly reviews policies
create policy "weekly_reviews_crud_member"
  on weekly_reviews for all
  using (
    exists (
      select 1 from project_members pm
      where pm.project_id = weekly_reviews.project_id and pm.user_id = auth.uid()
    )
  );

-- Investor updates policies
create policy "investor_updates_crud_member"
  on investor_updates for all
  using (
    exists (
      select 1 from project_members pm
      where pm.project_id = investor_updates.project_id and pm.user_id = auth.uid()
    )
  );

create policy "investor_updates_read_public"
  on investor_updates for select
  using (is_public = true);

-- Integration counters policies
create policy "integration_counters_crud_member"
  on integration_counters for all
  using (
    exists (
      select 1 from project_members pm
      where pm.project_id = integration_counters.project_id and pm.user_id = auth.uid()
    )
  );

create policy "key_results_update_goal_owner"
  on key_results for update
  using (
    exists (
      select 1 from goals g
      where g.id = key_results.goal_id and g.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from goals g
      where g.id = key_results.goal_id and g.user_id = auth.uid()
    )
  );

create policy "weekly_reviews_crud_self_member"
  on weekly_reviews
  for all
  using (
    user_id = auth.uid() and exists (
      select 1 from project_members pm
      where pm.project_id = weekly_reviews.project_id and pm.user_id = auth.uid()
    )
  )
  with check (
    user_id = auth.uid() and exists (
      select 1 from project_members pm
      where pm.project_id = weekly_reviews.project_id and pm.user_id = auth.uid()
    )
  );

create policy "investor_updates_crud_self_member"
  on investor_updates
  for all
  using (
    user_id = auth.uid() and exists (
      select 1 from project_members pm
      where pm.project_id = investor_updates.project_id and pm.user_id = auth.uid()
    )
  )
  with check (
    user_id = auth.uid() and exists (
      select 1 from project_members pm
      where pm.project_id = investor_updates.project_id and pm.user_id = auth.uid()
    )
  );

-- Public read policy for investor updates when is_public=true and slug matches
create policy "investor_updates_public_read"
  on investor_updates for select
  using (
    is_public = true
  );
