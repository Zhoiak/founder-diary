-- Fix the RLS policies that are blocking project creation

-- Drop the problematic policies
drop policy if exists "projects_insert_owner" on projects;
drop policy if exists "project_members_insert_owner" on project_members;

-- Create better policies for project creation
create policy "projects_insert_authenticated"
  on projects for insert
  with check (auth.uid() is not null and auth.uid() = owner);

-- Allow inserting project members if you're the owner of the project OR if no members exist yet (first member)
create policy "project_members_insert_owner_or_first"
  on project_members for insert
  with check (
    auth.uid() is not null and (
      -- You're inserting yourself as a member
      user_id = auth.uid() or
      -- You're the owner of the project
      exists (
        select 1 from projects p 
        where p.id = project_members.project_id and p.owner = auth.uid()
      ) or
      -- This is the first member being added (no existing members)
      not exists (
        select 1 from project_members pm 
        where pm.project_id = project_members.project_id
      )
    )
  );
