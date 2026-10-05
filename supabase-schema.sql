-- ============================================================
-- RƎ:ALYZE PUBLIC WEBSITE CMS
-- Chạy toàn bộ file này trong Supabase SQL Editor một lần.
-- Sau đó tạo một Auth User trong Authentication > Users.
-- Cuối cùng thêm user đó vào site_admins ở câu lệnh cuối file.
-- ============================================================

create extension if not exists pgcrypto;

create table if not exists public.site_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.site_news (
  id uuid primary key default gen_random_uuid(),
  title_vi text not null,
  title_en text,
  title_ja text,
  body_vi text not null default '',
  body_en text,
  body_ja text,
  image_url text,
  published_at date not null default current_date,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_songs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  singers text not null default '',
  release_date date not null default current_date,
  image_url text,
  external_url text,
  description_vi text,
  description_en text,
  description_ja text,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_rules (
  id uuid primary key default gen_random_uuid(),
  title_vi text not null,
  title_en text,
  title_ja text,
  body_vi text not null default '',
  body_en text,
  body_ja text,
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.site_admins enable row level security;
alter table public.site_news enable row level security;
alter table public.site_songs enable row level security;
alter table public.site_rules enable row level security;

-- Helper: admin check.
create or replace function public.is_site_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.site_admins
    where user_id = auth.uid()
  );
$$;

-- SITE ADMINS
drop policy if exists "Admins can read own membership" on public.site_admins;
create policy "Admins can read own membership"
on public.site_admins for select
to authenticated
using (user_id = auth.uid());

-- PUBLIC READ
drop policy if exists "Public can read published news" on public.site_news;
create policy "Public can read published news"
on public.site_news for select
to anon, authenticated
using (is_published = true or public.is_site_admin());

drop policy if exists "Public can read published songs" on public.site_songs;
create policy "Public can read published songs"
on public.site_songs for select
to anon, authenticated
using (is_published = true or public.is_site_admin());

drop policy if exists "Public can read published rules" on public.site_rules;
create policy "Public can read published rules"
on public.site_rules for select
to anon, authenticated
using (is_published = true or public.is_site_admin());

-- ADMIN WRITE
drop policy if exists "Admins manage news" on public.site_news;
create policy "Admins manage news"
on public.site_news for all
to authenticated
using (public.is_site_admin())
with check (public.is_site_admin());

drop policy if exists "Admins manage songs" on public.site_songs;
create policy "Admins manage songs"
on public.site_songs for all
to authenticated
using (public.is_site_admin())
with check (public.is_site_admin());

drop policy if exists "Admins manage rules" on public.site_rules;
create policy "Admins manage rules"
on public.site_rules for all
to authenticated
using (public.is_site_admin())
with check (public.is_site_admin());

-- STORAGE BUCKET
insert into storage.buckets (id, name, public)
values ('cms-media', 'cms-media', true)
on conflict (id) do update set public = true;

drop policy if exists "Public can view cms media" on storage.objects;
create policy "Public can view cms media"
on storage.objects for select
to public
using (bucket_id = 'cms-media');

drop policy if exists "Admins upload cms media" on storage.objects;
create policy "Admins upload cms media"
on storage.objects for insert
to authenticated
with check (bucket_id = 'cms-media' and public.is_site_admin());

drop policy if exists "Admins update cms media" on storage.objects;
create policy "Admins update cms media"
on storage.objects for update
to authenticated
using (bucket_id = 'cms-media' and public.is_site_admin())
with check (bucket_id = 'cms-media' and public.is_site_admin());

drop policy if exists "Admins delete cms media" on storage.objects;
create policy "Admins delete cms media"
on storage.objects for delete
to authenticated
using (bucket_id = 'cms-media' and public.is_site_admin());

-- ============================================================
-- SAU KHI tạo Auth User, lấy UUID của user rồi chạy:
--
-- insert into public.site_admins(user_id)
-- values ('UUID_CUA_AUTH_USER');
-- ============================================================
