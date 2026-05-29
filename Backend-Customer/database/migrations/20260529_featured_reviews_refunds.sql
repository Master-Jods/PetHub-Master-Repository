alter table public.reviews
  add column if not exists show_to_community boolean not null default false,
  add column if not exists community_featured_at timestamptz;

create index if not exists idx_reviews_show_to_community
  on public.reviews(show_to_community, community_featured_at desc);

drop policy if exists reviews_select_community_featured on public.reviews;
create policy reviews_select_community_featured
  on public.reviews for select to anon, authenticated
  using (show_to_community = true);

grant select on public.reviews to anon;
grant select, insert, update, delete on public.reviews to authenticated;

alter table public.orders
  add column if not exists refund_status text not null default 'None'
    check (refund_status in ('None', 'Pending Approval', 'Approved', 'Rejected', 'Refunded')),
  add column if not exists refund_reason text default '',
  add column if not exists refund_requested_at timestamptz,
  add column if not exists refund_approved_at timestamptz,
  add column if not exists refund_rejected_at timestamptz,
  add column if not exists refund_completed_at timestamptz;

create index if not exists idx_orders_refund_status
  on public.orders(refund_status, refund_requested_at desc);
