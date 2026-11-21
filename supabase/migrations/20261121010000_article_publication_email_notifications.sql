create table if not exists public.article_notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  subscriber_id uuid not null references public.subscribers(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','sending','sent','failed')),
  resend_email_id text,
  error_message text,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  unique (article_id, subscriber_id)
);
create index if not exists article_notification_deliveries_status_idx
  on public.article_notification_deliveries (status, created_at desc);
alter table public.article_notification_deliveries enable row level security;
revoke all on public.article_notification_deliveries from anon;
grant select, insert, update on public.article_notification_deliveries to authenticated;
