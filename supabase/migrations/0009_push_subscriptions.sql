-- =====================================================================
-- Migration 0009: Bảng lưu push subscription cho Web Push API.
--
-- Mỗi subscription gắn với một user. endpoint là unique để tránh
-- lưu trùng khi user đăng ký nhiều lần từ cùng trình duyệt.
-- RLS đảm bảo user chỉ thấy/sửa/xóa subscription của chính mình.
-- =====================================================================

create table if not exists public.push_subscriptions (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users on delete cascade,
  endpoint   text        not null unique,
  p256dh     text        not null,
  auth       text        not null,
  created_at timestamptz not null default now()
);

-- Bật Row Level Security
alter table public.push_subscriptions enable row level security;

-- Policy: user chỉ thấy/sửa/xóa subscription của chính mình
drop policy if exists "push_subscriptions_owner" on public.push_subscriptions;
create policy "push_subscriptions_owner" on public.push_subscriptions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
