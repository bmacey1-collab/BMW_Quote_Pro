-- Vehicle Quote Workspace: Supabase database setup
-- Run this entire file in Supabase Dashboard → SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  quote_number text not null,
  quote_date date,
  customer_name text,
  salesperson text,
  status text not null default 'Quoted'
    check (status in ('Quoted', 'Pending', 'Sold', 'Lost')),
  vehicle text,
  vin text,
  notes text,
  form_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, quote_number)
);

create index if not exists quotes_user_updated_idx
  on public.quotes (user_id, updated_at desc);

create index if not exists quotes_user_customer_idx
  on public.quotes (user_id, lower(customer_name));

create index if not exists quotes_user_vin_idx
  on public.quotes (user_id, lower(vin));

create or replace function public.set_quotes_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists quotes_set_updated_at on public.quotes;

create trigger quotes_set_updated_at
before update on public.quotes
for each row
execute function public.set_quotes_updated_at();

alter table public.quotes enable row level security;

grant select, insert, update, delete
on table public.quotes
to authenticated;

revoke all
on table public.quotes
from anon;

drop policy if exists "Users can read their own quotes" on public.quotes;
create policy "Users can read their own quotes"
on public.quotes
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their own quotes" on public.quotes;
create policy "Users can insert their own quotes"
on public.quotes
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own quotes" on public.quotes;
create policy "Users can update their own quotes"
on public.quotes
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own quotes" on public.quotes;
create policy "Users can delete their own quotes"
on public.quotes
for delete
to authenticated
using ((select auth.uid()) = user_id);
