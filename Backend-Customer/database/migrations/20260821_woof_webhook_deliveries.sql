create table if not exists public.webhook_deliveries (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event text not null,
  transaction_id text not null,
  transaction_type text not null,
  status text not null default 'pending'
    check (status in ('pending', 'delivered', 'failed', 'skipped')),
  attempts integer not null default 0,
  last_status_code integer,
  last_error text,
  last_attempt_at timestamptz,
  delivered_at timestamptz,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (provider, event, transaction_id)
);

create index if not exists idx_webhook_deliveries_provider_status
  on public.webhook_deliveries(provider, status, updated_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_webhook_deliveries_updated_at on public.webhook_deliveries;
create trigger trg_webhook_deliveries_updated_at
before update on public.webhook_deliveries
for each row execute function public.set_updated_at();

alter table public.webhook_deliveries enable row level security;
