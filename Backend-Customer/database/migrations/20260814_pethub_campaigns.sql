create table if not exists public.pethub_campaigns (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text not null default '',
  description text not null default '',
  campaign_image_url text not null default '',
  cta_text text not null default '',
  promo_mechanic text not null default '',
  target_segment text not null default '',
  source text not null default 'WOOF',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_pethub_campaigns_active
  on public.pethub_campaigns(is_active);

create index if not exists idx_pethub_campaigns_sort
  on public.pethub_campaigns(sort_order, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_pethub_campaigns_updated_at on public.pethub_campaigns;
create trigger trg_pethub_campaigns_updated_at
before update on public.pethub_campaigns
for each row execute function public.set_updated_at();

alter table public.pethub_campaigns enable row level security;

drop policy if exists pethub_campaigns_public_read on public.pethub_campaigns;
create policy pethub_campaigns_public_read
  on public.pethub_campaigns for select to anon, authenticated
  using (is_active = true);

grant select on table public.pethub_campaigns to anon, authenticated;
