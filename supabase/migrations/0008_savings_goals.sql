-- =====================================================================
-- Bảng mục tiêu tiết kiệm (savings_goals).
-- Người dùng đặt mục tiêu (tên, số tiền đích, deadline), theo dõi
-- tiến độ qua current_amount. Không có FK tới accounts/categories
-- nên WITH CHECK chỉ cần kiểm user_id = auth.uid().
-- =====================================================================

create table if not exists public.savings_goals (
  id             uuid        primary key default gen_random_uuid(),
  user_id        uuid        not null references auth.users (id) on delete cascade,
  name           text        not null,
  target_amount  numeric     not null,
  current_amount numeric     not null default 0,
  deadline       date,
  note           text,
  created_at     timestamptz not null default now()
);

alter table public.savings_goals enable row level security;

drop policy if exists "savings_goals_owner" on public.savings_goals;
create policy "savings_goals_owner" on public.savings_goals
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
