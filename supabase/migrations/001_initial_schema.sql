-- 001_initial_schema.sql
-- Initial schema for micro-business-launchpad

create extension if not exists "uuid-ossp";

-- Profiles
create table if not exists profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  business_name text,
  industry text,
  business_structure text,
  province text default 'QC',
  language text default 'fr',
  intake_completed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Roadmap steps
create table if not exists roadmap_steps (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  step_key text not null,
  title_en text,
  title_fr text,
  status text default 'pending' check (status in ('pending', 'in_progress', 'completed')),
  priority integer default 0,
  due_date date,
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Funding matches
create table if not exists funding_matches (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  program_key text not null,
  score integer default 0,
  eligible boolean default false,
  saved boolean default false,
  created_at timestamptz default now()
);

-- Financial snapshots
create table if not exists financial_snapshots (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  annual_revenue numeric default 0,
  annual_expenses numeric default 0,
  net_income numeric generated always as (annual_revenue - annual_expenses) stored,
  snapshot_date date default current_date,
  created_at timestamptz default now()
);

-- Chat messages
create table if not exists chat_messages (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  sources jsonb,
  created_at timestamptz default now()
);

-- RLS policies
alter table profiles enable row level security;
alter table roadmap_steps enable row level security;
alter table funding_matches enable row level security;
alter table financial_snapshots enable row level security;
alter table chat_messages enable row level security;

create policy "Users can manage own profile" on profiles
  for all using (auth.uid() = user_id);

create policy "Users can manage own roadmap" on roadmap_steps
  for all using (auth.uid() = user_id);

create policy "Users can manage own funding matches" on funding_matches
  for all using (auth.uid() = user_id);

create policy "Users can manage own snapshots" on financial_snapshots
  for all using (auth.uid() = user_id);

create policy "Users can manage own messages" on chat_messages
  for all using (auth.uid() = user_id);
