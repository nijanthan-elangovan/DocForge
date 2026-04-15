-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- Create shared_docs table
create table if not exists shared_docs (
  id text primary key,
  title text not null default 'Untitled',
  markdown text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days')
);

-- Enable Row Level Security
alter table shared_docs enable row level security;

-- Allow anyone to read shared docs (they're public by design)
create policy "Anyone can read shared docs"
  on shared_docs for select
  using (expires_at > now());

-- Allow anyone to insert shared docs (no auth required)
create policy "Anyone can create shared docs"
  on shared_docs for insert
  with check (true);

-- Auto-delete expired docs daily via pg_cron (optional, enable in Supabase Dashboard > Database > Extensions > pg_cron)
-- select cron.schedule('cleanup-expired-docs', '0 3 * * *', $$delete from shared_docs where expires_at < now()$$);

-- Create index for expiry lookups
create index if not exists idx_shared_docs_expires_at on shared_docs (expires_at);
