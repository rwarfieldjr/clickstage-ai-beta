-- Enable pgcrypto for gen_random_uuid if not enabled
create extension if not exists "pgcrypto";

-- Create error_events table for storing error alerts
create table if not exists public.error_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  subject text not null,
  code integer,
  hostname text,
  path text,
  details jsonb
);

-- Turn RLS on and allow only service-role to write/read
alter table public.error_events enable row level security;

-- Drop existing policy if it exists
drop policy if exists "error_events service access" on public.error_events;

-- Create policy that allows only service_role to read/write
create policy "error_events service access"
on public.error_events
for all
to service_role
using (true)
with check (true);