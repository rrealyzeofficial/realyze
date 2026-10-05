-- ============================================================
-- RƎ:ALYZE ADMIN LOGIN FIX
-- Chạy file này MỘT LẦN trong Supabase SQL Editor.
-- Không cần chạy lại toàn bộ supabase-schema.sql.
-- ============================================================

-- 1) Đảm bảo hàm kiểm tra admin tồn tại và bypass RLS đúng cách.
create or replace function public.is_site_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.site_admins
    where user_id = auth.uid()
  );
$$;

-- Cho tài khoản đăng nhập được phép gọi hàm kiểm tra quyền.
grant execute on function public.is_site_admin() to authenticated;
grant execute on function public.is_site_admin() to anon;

-- 2) Tự động gắn admin@realyze.com vào bảng site_admins.
insert into public.site_admins(user_id)
select id
from auth.users
where lower(email) = lower('admin@realyze.com')
on conflict (user_id) do nothing;

-- 3) Kiểm tra kết quả.
-- Dòng này PHẢI trả về 1 user và admin_added = true.
select
  u.id,
  u.email,
  u.email_confirmed_at,
  (a.user_id is not null) as admin_added
from auth.users u
left join public.site_admins a on a.user_id = u.id
where lower(u.email) = lower('admin@realyze.com');

-- Nếu query trên không trả về dòng nào:
-- user admin@realyze.com chưa thực sự được tạo trong Authentication > Users.
--
-- Nếu email_confirmed_at = null:
-- vào Authentication > Users và Confirm email cho user đó.
--
-- Nếu admin_added = false:
-- chạy lại phần INSERT phía trên.
