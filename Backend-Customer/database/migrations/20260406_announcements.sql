create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  category text not null default 'Announcement',
  tag text not null default '',
  meta text not null default '',
  title text not null,
  description text not null default '',
  note text not null default '',
  highlight text not null default '',
  footer text not null default '',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_announcements_active on public.announcements(is_active);
create index if not exists idx_announcements_sort on public.announcements(sort_order, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_announcements_updated_at on public.announcements;
create trigger trg_announcements_updated_at
before update on public.announcements
for each row execute function public.set_updated_at();

alter table public.announcements enable row level security;

drop policy if exists announcements_public_read on public.announcements;
create policy announcements_public_read
  on public.announcements for select to anon, authenticated
  using (is_active = true);
