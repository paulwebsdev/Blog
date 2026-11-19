-- PaulNova production schema. Public article images remain external URLs (for example Blogger).
create extension if not exists pgcrypto;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text not null default 'pending' check (role in ('pending','admin','editor')),
  created_at timestamptz not null default now()
);
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references public.profiles(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  title text not null,
  slug text not null unique,
  excerpt text not null default '',
  content jsonb not null default '[]'::jsonb,
  image_url text,
  image_alt text,
  sources jsonb not null default '[]'::jsonb,
  correction_note text,
  seo_title text,
  seo_description text,
  status text not null default 'draft' check (status in ('draft','published','scheduled')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists articles_status_published_idx on public.articles (status,published_at desc);
create index if not exists articles_category_idx on public.articles (category_id);
create index if not exists articles_updated_idx on public.articles (updated_at desc);
create index if not exists articles_author_idx on public.articles (author_id);
create table if not exists public.subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  status text not null default 'active' check (status in ('active','unsubscribed')),
  created_at timestamptz not null default now()
);

create or replace function private.is_paulnova_admin()
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin'); $$;
revoke all on function private.is_paulnova_admin() from public, anon;
grant execute on function private.is_paulnova_admin() to authenticated;

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.articles enable row level security;
alter table public.subscribers enable row level security;

create policy "Users can read own profile or admins can read profiles" on public.profiles for select to authenticated
using ((select auth.uid()) = id or (select private.is_paulnova_admin()));

create policy "Public can read active categories" on public.categories for select to anon using (is_active = true);
create policy "Signed-in editors can read categories" on public.categories for select to authenticated
using (is_active = true or (select private.is_paulnova_admin()));
create policy "Admins can insert categories" on public.categories for insert to authenticated with check ((select private.is_paulnova_admin()));
create policy "Admins can update categories" on public.categories for update to authenticated
using ((select private.is_paulnova_admin())) with check ((select private.is_paulnova_admin()));
create policy "Admins can delete categories" on public.categories for delete to authenticated using ((select private.is_paulnova_admin()));

create policy "Public can read live articles" on public.articles for select to anon
using (status in ('published','scheduled') and published_at is not null and published_at <= now());
create policy "Signed-in editors can read articles" on public.articles for select to authenticated
using ((status in ('published','scheduled') and published_at is not null and published_at <= now()) or
exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('admin','editor')));
create policy "Editors can insert articles" on public.articles for insert to authenticated
with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('admin','editor')));
create policy "Editors can update articles" on public.articles for update to authenticated
using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('admin','editor')))
with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('admin','editor')));
create policy "Editors can delete articles" on public.articles for delete to authenticated
using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('admin','editor')));

create policy "Anyone can subscribe" on public.subscribers for insert to anon, authenticated
with check (length(trim(email)) between 3 and 320);
create policy "Admins can read subscribers" on public.subscribers for select to authenticated
using ((select private.is_paulnova_admin()));

insert into public.categories (name,slug,description) values
('Technology','technology','Apps, gadgets, software and practical technology guides.'),
('Artificial Intelligence','artificial-intelligence','AI tools, tutorials and useful applications.'),
('Business & Money','business-money','Digital business, freelancing and entrepreneurship.'),
('Education & Careers','education-careers','Digital skills, learning and career opportunities.')
on conflict (slug) do nothing;


-- Consented first-party analytics and article engagement events.
create table if not exists public.page_views (
  id bigint generated by default as identity primary key,
  page_path text not null,
  page_title text,
  article_slug text,
  referrer_host text,
  traffic_source text not null default 'Direct',
  utm_medium text,
  utm_campaign text,
  session_id uuid not null,
  event_type text not null default 'page_view',
  event_value text,
  duration_seconds integer,
  created_at timestamptz not null default now(),
  constraint page_views_event_type_check check (event_type in ('page_view','reading_time','scroll_depth','bookmark_add','bookmark_remove','share_click','outbound_click')),
  constraint page_views_duration_seconds_check check (duration_seconds is null or (duration_seconds >= 0 and duration_seconds <= 86400))
);
alter table public.page_views add column if not exists event_type text not null default 'page_view';
alter table public.page_views add column if not exists event_value text;
alter table public.page_views add column if not exists duration_seconds integer;
alter table public.page_views drop constraint if exists page_views_event_type_check;
alter table public.page_views add constraint page_views_event_type_check check (event_type in ('page_view','reading_time','scroll_depth','bookmark_add','bookmark_remove','share_click','outbound_click'));
alter table public.page_views drop constraint if exists page_views_duration_seconds_check;
alter table public.page_views add constraint page_views_duration_seconds_check check (duration_seconds is null or (duration_seconds >= 0 and duration_seconds <= 86400));
create index if not exists page_views_created_at_idx on public.page_views (created_at desc);
create index if not exists page_views_article_created_at_idx on public.page_views (article_slug, created_at desc);
create index if not exists page_views_event_type_created_at_idx on public.page_views (event_type, created_at desc);
alter table public.page_views enable row level security;
grant insert on public.page_views to anon, authenticated;
grant select on public.page_views to authenticated;
do $
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'page_views' and policyname = 'Public can record consented page views') then
    create policy "Public can record consented page views" on public.page_views for insert to anon, authenticated with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'page_views' and policyname = 'PaulNova admins can read page analytics') then
    create policy "PaulNova admins can read page analytics" on public.page_views for select to authenticated using ((select private.is_paulnova_admin()));
  end if;
end $;

-- Bootstrap the first admin only after creating that person in Supabase Auth:
-- insert into public.profiles (id,display_name,role)
-- values ('AUTH_USER_UUID','PaulNova Admin','admin');


-- Public site configuration. Public visitors can read social links and Search Console verification only.
create table if not exists public.site_settings (
  id integer primary key default 1 check (id = 1),
  social_links jsonb not null default '{}'::jsonb,
  logo_url text,
  favicon_url text,
  google_site_verification text,
  updated_at timestamptz not null default now()
);
alter table public.site_settings add column if not exists logo_url text;
alter table public.site_settings add column if not exists favicon_url text;
alter table public.site_settings enable row level security;
drop policy if exists "Public can read site settings" on public.site_settings;
create policy "Public can read site settings" on public.site_settings for select to anon, authenticated using (true);
drop policy if exists "PaulNova admins can insert site settings" on public.site_settings;
create policy "PaulNova admins can insert site settings" on public.site_settings for insert to authenticated with check ((select private.is_paulnova_admin()));
drop policy if exists "PaulNova admins can update site settings" on public.site_settings;
create policy "PaulNova admins can update site settings" on public.site_settings for update to authenticated using ((select private.is_paulnova_admin())) with check ((select private.is_paulnova_admin()));
grant select on public.site_settings to anon, authenticated;
grant insert, update on public.site_settings to authenticated;
insert into public.site_settings (id) values (1) on conflict (id) do nothing;

-- Editorial source citations and correction notices for existing installations.
alter table public.articles add column if not exists sources jsonb not null default '[]'::jsonb;
alter table public.articles add column if not exists correction_note text;

-- Author profile metadata and safely scoped profile update RPC.
alter table public.profiles add column if not exists author_slug text;
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists website_url text;
create or replace function private.update_author_profile(
  p_display_name text, p_author_slug text, p_bio text, p_avatar_url text, p_website_url text
) returns void language plpgsql security definer set search_path = ''
as $function$
begin
  if (select auth.uid()) is null then raise exception 'Authentication required'; end if;
  update public.profiles
  set display_name = left(trim(p_display_name), 100),
      author_slug = p_author_slug,
      bio = nullif(left(trim(coalesce(p_bio, '')), 1000), ''),
      avatar_url = nullif(trim(coalesce(p_avatar_url, '')), ''),
      website_url = nullif(trim(coalesce(p_website_url, '')), '')
  where id = (select auth.uid()) and role in ('admin', 'editor');
  if not found then raise exception 'Editorial profile not found or not authorised'; end if;
end;
$function$;
revoke all on function private.update_author_profile(text,text,text,text,text) from public, anon;
grant execute on function private.update_author_profile(text,text,text,text,text) to authenticated;
create or replace function public.update_author_profile(
  p_display_name text, p_author_slug text, p_bio text, p_avatar_url text, p_website_url text
) returns void language sql security invoker set search_path = ''
as $function$
  select private.update_author_profile($1,$2,$3,$4,$5);
$function$;
revoke all on function public.update_author_profile(text,text,text,text,text) from public, anon;
grant execute on function public.update_author_profile(text,text,text,text,text) to authenticated;
