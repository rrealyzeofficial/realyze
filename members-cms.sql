-- ============================================================
-- RƎ:ALYZE MEMBERS CMS
-- Chạy MỘT LẦN trong Supabase SQL Editor.
-- ============================================================

create table if not exists public.site_members (
  id text primary key,
  name text not null,
  japanese text,
  romaji text,

  quote_vi text,
  quote_en text,
  quote_ja text,

  birthday text,

  hobby_vi text,
  hobby_en text,
  hobby_ja text,

  color text not null default '#cccccc',
  image_url text,

  x_url text,
  youtube_url text,
  tiktok_url text,

  sort_order integer not null default 0,
  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.site_members
  enable row level security;

grant select
on public.site_members
to anon, authenticated;

grant insert, update, delete
on public.site_members
to authenticated;

drop policy if exists
  "Public can read active members"
on public.site_members;

create policy
  "Public can read active members"
on public.site_members
for select
to anon, authenticated
using (
  is_active = true
  or public.is_site_admin()
);

drop policy if exists
  "Admins manage members"
on public.site_members;

create policy
  "Admins manage members"
on public.site_members
for all
to authenticated
using (public.is_site_admin())
with check (public.is_site_admin());

insert into public.site_members (
  id, name, japanese, romaji,
  color, image_url, sort_order, is_active
)
values
  ('shota','Shota','ショウタ','Shōta','#B0D9FA','assets/members/shota.jpg',1,true),
  ('vani','Vani','ヴァニ','Vani','#F9CDD4','assets/members/vani.jpg',2,true),
  ('shoto','Shoto','ショウト','Shōto','#3A1865','assets/members/shoto.jpg',3,true),
  ('mikon','Mikon','ミコン','Mikon','#A481C2','assets/members/mikon.jpg',4,true),
  ('elis','Elis','エリス','Erisu','#940912','assets/members/elis.jpg',5,true),
  ('hikari','Hikari','ヒカリ','Hikari','#E0115F','assets/members/hikari.jpg',6,true),
  ('ebi','Ebi','エビ','Ebi','#97A2FF','assets/members/ebi.jpg',7,true),
  ('zanith','Zanith','ザニス','Zanisu','#66C1FF','assets/members/zanith.jpg',8,true),
  ('eclia','Eclia','エクリア','Ekuria','#FFCDCD','assets/members/eclia.jpg',9,true)
on conflict (id) do nothing;

select
  id,
  name,
  japanese,
  romaji,
  color,
  sort_order,
  is_active
from public.site_members
order by sort_order, name;
