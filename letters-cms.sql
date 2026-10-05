-- ============================================================
-- RƎ:ALYZE WEBSITE LETTER / INBOX
-- Chạy MỘT LẦN trong Supabase SQL Editor.
-- ============================================================

create extension if not exists pgcrypto;

create table if not exists public.site_letters (
  id uuid primary key default gen_random_uuid(),

  sender_name text not null
    check (
      char_length(sender_name)
      between 1 and 80
    ),

  content text not null
    check (
      char_length(content)
      between 1 and 3000
    ),

  language text
    check (
      language is null
      or language in ('vi','en','ja')
    ),

  is_read boolean not null
    default false,

  created_at timestamptz not null
    default now()
);

create index if not exists
  site_letters_created_at_idx
on public.site_letters(
  created_at desc
);

create index if not exists
  site_letters_unread_idx
on public.site_letters(
  is_read,
  created_at desc
);

alter table public.site_letters
  enable row level security;

-- Không cấp INSERT/SELECT cho anonymous.
-- Người xem chỉ gửi thông qua Edge Function đã verify CAPTCHA.
revoke all
on public.site_letters
from anon;

grant select, update, delete
on public.site_letters
to authenticated;

drop policy if exists
  "Admins can read letters"
on public.site_letters;

create policy
  "Admins can read letters"
on public.site_letters
for select
to authenticated
using (
  public.is_site_admin()
);

drop policy if exists
  "Admins can update letters"
on public.site_letters;

create policy
  "Admins can update letters"
on public.site_letters
for update
to authenticated
using (
  public.is_site_admin()
)
with check (
  public.is_site_admin()
);

drop policy if exists
  "Admins can delete letters"
on public.site_letters;

create policy
  "Admins can delete letters"
on public.site_letters
for delete
to authenticated
using (
  public.is_site_admin()
);

select
  count(*) as total_letters
from public.site_letters;
