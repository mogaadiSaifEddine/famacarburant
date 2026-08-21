create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  latitude double precision not null check (latitude between 30 and 38),
  longitude double precision not null check (longitude between 7 and 12),
  fuel_type text not null check (fuel_type in ('gasoline', 'diesel', 'diesel50')),
  note text check (char_length(note) <= 140),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index if not exists reports_expires_at_idx on public.reports (expires_at);

alter table public.reports enable row level security;

create policy "Anyone can read active reports"
on public.reports for select
using (expires_at > now());

create policy "Anyone can create reports"
on public.reports for insert
with check (expires_at > now() and expires_at <= now() + interval '7 days');
