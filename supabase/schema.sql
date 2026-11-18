-- PaulNova initial Supabase schema
-- Run this in the Supabase SQL Editor after creating your project.
-- No image storage bucket is required: article images are stored as public URLs.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text not null default 'editor' check (role in ('admin', 'editor')),
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
  status text not null default 'draft' check (status in ('draft', 'published', 'scheduled')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists articles_status_published_idx
  on public.articles (status, published_at desc);
create index if not exists articles_category_idx on public.articles (category_id);
create index if not exists articles_updated_idx on public.articles (updated_at desc);

create table if not exists public.subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  status text not null default 'active' check (status in ('active', 'unsubscribed')),
  created_at timestamptz not null default now()
);

create or replace function public.is_paulnova_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.articles enable row level security;
alter table public.subscribers enable row level security;

create policy "Users can read their own profile"
  on public.profiles for select to authenticated
  using (id = auth.uid());

create policy "Admins can manage profiles"
  on public.profiles for all to authenticated
  using (public.is_paulnova_admin())
  with check (public.is_paulnova_admin());

create policy "Public can read active categories"
  on public.categories for select to anon, authenticated
  using (is_active = true);

create policy "Admins can manage categories"
  on public.categories for all to authenticated
  using (public.is_paulnova_admin())
  with check (public.is_paulnova_admin());

create policy "Public can read published articles"
  on public.articles for select to anon, authenticated
  using (status = 'published' and published_at <= now());

create policy "Editors and admins can manage articles"
  on public.articles for all to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'editor')
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'editor')
    )
  );

create policy "Anyone can subscribe"
  on public.subscribers for insert to anon, authenticated
  with check (email <> '');

create policy "Admins can read subscribers"
  on public.subscribers for select to authenticated
  using (public.is_paulnova_admin());

-- Seed the publication's four starting sections.
insert into public.categories (name, slug, description) values
  ('Technology', 'technology', 'Apps, gadgets, software and practical technology guides.'),
  ('Artificial Intelligence', 'artificial-intelligence', 'AI tools, tutorials and useful applications.'),
  ('Business & Money', 'business-money', 'Digital business, freelancing and entrepreneurship.'),
  ('Education & Careers', 'education-careers', 'Digital skills, learning and career opportunities.')
on conflict (slug) do nothing;
