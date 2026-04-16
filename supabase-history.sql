-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- Article history: stores generated docs for 7 days, keyed by IP
create table if not exists article_history (
  id text primary key,
  ip_address text not null,
  title text not null default 'Untitled',
  markdown text not null,
  source_preview text, -- first 200 chars of input for display
  settings jsonb,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days')
);

alter table article_history enable row level security;

create policy "Anyone can read article history"
  on article_history for select using (expires_at > now());

create policy "Anyone can insert article history"
  on article_history for insert with check (true);

create index if not exists idx_article_history_ip on article_history (ip_address, created_at desc);
create index if not exists idx_article_history_expires on article_history (expires_at);

-- Chat sessions: stores chat for 1 day, keyed by IP
create table if not exists chat_sessions (
  id text primary key,
  ip_address text not null,
  title text not null default 'Chat Session',
  messages jsonb not null default '[]'::jsonb,
  source_preview text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '1 day')
);

alter table chat_sessions enable row level security;

create policy "Anyone can read chat sessions"
  on chat_sessions for select using (expires_at > now());

create policy "Anyone can insert chat sessions"
  on chat_sessions for insert with check (true);

create policy "Anyone can update chat sessions"
  on chat_sessions for update using (expires_at > now());

create index if not exists idx_chat_sessions_ip on chat_sessions (ip_address, updated_at desc);
create index if not exists idx_chat_sessions_expires on chat_sessions (expires_at);

-- Optional: auto-cleanup with pg_cron
-- select cron.schedule('cleanup-expired-articles', '0 3 * * *', $$delete from article_history where expires_at < now()$$);
-- select cron.schedule('cleanup-expired-chats', '0 3 * * *', $$delete from chat_sessions where expires_at < now()$$);
