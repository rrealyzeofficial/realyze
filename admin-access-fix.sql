-- ============================================================
-- RƎ:ALYZE ADMIN DATABASE ACCESS FIX
-- Chạy MỘT LẦN trong Supabase SQL Editor.
-- ============================================================

create table if not exists public.site_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.site_admins enable row level security;

-- Gắn admin@realyze.com vào danh sách admin.
insert into public.site_admins(user_id)
select id
from auth.users
where lower(email) = lower('admin@realyze.com')
on conflict (user_id) do nothing;

create or replace function public.is_site_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.site_admins
    where user_id = auth.uid()
  );
$$;

grant execute on function public.is_site_admin() to authenticated;

drop policy if exists "Admins can read own membership" on public.site_admins;
create policy "Admins can read own membership"
on public.site_admins
for select
to authenticated
using (user_id = auth.uid());

-- Kiểm tra trực tiếp.
select
  u.id,
  u.email,
  u.email_confirmed_at,
  (a.user_id is not null) as admin_added
from auth.users u
left join public.site_admins a
  on a.user_id = u.id
where lower(u.email) = lower('admin@realyze.com');

-- Kết quả mong muốn:
-- email = admin@realyze.com
-- email_confirmed_at = có ngày giờ
-- admin_added = true
