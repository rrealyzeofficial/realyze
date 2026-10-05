-- ============================================================
-- RƎ:ALYZE CONTENT SYNC + ABOUT + MUSIC MIGRATION
-- Chạy MỘT LẦN trong Supabase SQL Editor.
-- ============================================================

-- Cho phép bài hát chưa có ngày phát hành.
alter table if exists public.site_songs
  alter column release_date drop not null;

-- ABOUT
create table if not exists public.site_about (
  id text primary key default 'main',

  page_title_vi text not null default 'Về RƎ:ALYZE',
  page_title_en text,
  page_title_ja text,

  page_desc_vi text not null default '',
  page_desc_en text,
  page_desc_ja text,

  section1_title_vi text not null default 'RƎ:ALYZE',
  section1_title_en text,
  section1_title_ja text,

  section1_body_vi text not null default '',
  section1_body_en text,
  section1_body_ja text,

  section2_title_vi text not null default 'RE:SONANCE',
  section2_title_en text,
  section2_title_ja text,

  section2_body_vi text not null default '',
  section2_body_en text,
  section2_body_ja text,

  updated_at timestamptz not null default now()
);

alter table public.site_about enable row level security;

-- Public website needs explicit SELECT privileges.
grant select on public.site_news to anon, authenticated;
grant select on public.site_songs to anon, authenticated;
grant select on public.site_rules to anon, authenticated;
grant select on public.site_about to anon, authenticated;

-- Admin CRUD privileges.
grant insert, update, delete on public.site_news to authenticated;
grant insert, update, delete on public.site_songs to authenticated;
grant insert, update, delete on public.site_rules to authenticated;
grant insert, update, delete on public.site_about to authenticated;

-- NEWS
drop policy if exists "Public can read published news"
  on public.site_news;

create policy "Public can read published news"
on public.site_news
for select
to anon, authenticated
using (
  is_published = true
  or public.is_site_admin()
);

-- MUSIC
drop policy if exists "Public can read published songs"
  on public.site_songs;

create policy "Public can read published songs"
on public.site_songs
for select
to anon, authenticated
using (
  is_published = true
  or public.is_site_admin()
);

-- RULE
drop policy if exists "Public can read published rules"
  on public.site_rules;

create policy "Public can read published rules"
on public.site_rules
for select
to anon, authenticated
using (
  is_published = true
  or public.is_site_admin()
);

-- ABOUT
drop policy if exists "Public can read about"
  on public.site_about;

create policy "Public can read about"
on public.site_about
for select
to anon, authenticated
using (true);

drop policy if exists "Admins manage about"
  on public.site_about;

create policy "Admins manage about"
on public.site_about
for all
to authenticated
using (public.is_site_admin())
with check (public.is_site_admin());

-- About hiện tại, không có chữ hướng dẫn / ví dụ.
insert into public.site_about (
  id,
  page_title_vi, page_title_en, page_title_ja,
  page_desc_vi, page_desc_en, page_desc_ja,
  section1_title_vi, section1_title_en, section1_title_ja,
  section1_body_vi, section1_body_en, section1_body_ja,
  section2_title_vi, section2_title_en, section2_title_ja,
  section2_body_vi, section2_body_en, section2_body_ja
)
values (
  'main',

  'Về RƎ:ALYZE',
  'About RƎ:ALYZE',
  'RƎ:ALYZEについて',

  'RƎ:ALYZE và thế giới âm nhạc của chúng mình.',
  'RƎ:ALYZE and our musical world.',
  'RƎ:ALYZEと私たちの音楽の世界。',

  'RƎ:ALYZE',
  'RƎ:ALYZE',
  'RƎ:ALYZE',

  '<p>RƎ:ALYZE là một nhóm cover Việt Nam tập trung vào J-pop, Vocaloid và phong cách Utaite. Mỗi thành viên mang một màu sắc riêng và cùng nhau tạo nên các dự án âm nhạc của nhóm.</p>',
  '<p>RƎ:ALYZE is a Vietnamese cover group focused on J-pop, Vocaloid, and Utaite-style music. Each member brings a distinct color to the group’s projects.</p>',
  '<p>RƎ:ALYZEは、J-POP、Vocaloid、歌い手スタイルを中心に活動するベトナムのカバーグループです。メンバーそれぞれの個性が、グループの音楽を形作っています。</p>',

  'RE:SONANCE',
  'RE:SONANCE',
  'RE:SONANCE',

  '<p>RE:SONANCE là chủ đề kết nối các thành viên và những dự án của RƎ:ALYZE thông qua sự cộng hưởng giữa giọng hát, hình ảnh và cảm xúc.</p>',
  '<p>RE:SONANCE connects the members and projects of RƎ:ALYZE through the resonance of voices, visuals, and emotion.</p>',
  '<p>RE:SONANCEは、声・ビジュアル・感情の共鳴を通して、RƎ:ALYZEのメンバーとプロジェクトをつなぐテーマです。</p>'
)
on conflict (id) do nothing;

-- Chuyển các Music cũ thành dữ liệu thật để Admin sửa được.
insert into public.site_songs (
  title, singers, release_date, image_url, external_url,
  description_vi, description_en, description_ja, is_published
)
select
  'Virtual to LIVE', 'RƎ:ALYZE', null, null, null,
  null, null, null, true
where not exists (
  select 1 from public.site_songs
  where lower(title) = lower('Virtual to LIVE')
);

insert into public.site_songs (
  title, singers, release_date, image_url, external_url,
  description_vi, description_en, description_ja, is_published
)
select
  'Teikoku Shoujo', 'Ebi × Vani', null, null, null,
  null, null, null, true
where not exists (
  select 1 from public.site_songs
  where lower(title) = lower('Teikoku Shoujo')
);

insert into public.site_songs (
  title, singers, release_date, image_url, external_url,
  description_vi, description_en, description_ja, is_published
)
select
  'Kokoronashi', '', null, null, null,
  null, null, null, true
where not exists (
  select 1 from public.site_songs
  where lower(title) = lower('Kokoronashi')
);

-- Kiểm tra nhanh.
select 'news' as type, count(*) as total
from public.site_news
union all
select 'music', count(*) from public.site_songs
union all
select 'rules', count(*) from public.site_rules
union all
select 'about', count(*) from public.site_about;
