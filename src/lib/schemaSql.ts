export const SUPABASE_SQL_SETUP = `-- ==========================================
-- Oğulr Archive: Database Schema & Security
-- Run this in your Supabase project SQL Editor
-- ==========================================

-- 1. Create the posts table
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade default auth.uid(),
  content text not null,
  post_type text default 'thought',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  is_archived boolean default false
);

-- Ensure post_type column exists if table was created previously
alter table public.posts add column if not exists post_type text default 'thought';

-- 2. Full-text search index for high performance archive searching
create index if not exists posts_content_search_idx 
  on public.posts 
  using gin (to_tsvector('english', content));

-- 3. Enable Row Level Security (RLS)
alter table public.posts enable row level security;

-- 4. RLS Policies: Restrict access strictly to the authenticated owner
create policy "Authenticated owner select" on public.posts
  for select using (auth.uid() = user_id);

create policy "Authenticated owner insert" on public.posts
  for insert with check (auth.uid() = user_id);

create policy "Authenticated owner update" on public.posts
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Authenticated owner delete" on public.posts
  for delete using (auth.uid() = user_id);
`;
