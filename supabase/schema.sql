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

create policy "Public can read published articles" on public.articles for select to anon
using (status = 'published' and published_at is not null and published_at <= now());
create policy "Signed-in editors can read articles" on public.articles for select to authenticated
using ((status = 'published' and published_at is not null and published_at <= now()) or
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

-- Bootstrap the first admin only after creating that person in Supabase Auth:
-- insert into public.profiles (id,display_name,role)
-- values ('AUTH_USER_UUID','PaulNova Admin','admin');
