-- =====================================================================
-- Chuyển khoản giữa các ví (transfers)
-- Tiền dịch chuyển nội bộ giữa 2 ví của cùng người dùng — KHÔNG tính
-- vào thu/chi để báo cáo dòng tiền không bị sai lệch.
-- =====================================================================

create table if not exists public.transfers (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  from_account_id uuid not null references public.accounts (id) on delete cascade,
  to_account_id   uuid not null references public.accounts (id) on delete cascade,
  amount          numeric(14,2) not null check (amount >= 0.01 and amount <= 999999999.99),
  date            date not null,
  note            text,
  created_at      timestamptz not null default now(),
  check (from_account_id <> to_account_id)
);

create index if not exists transfers_user_date_idx
  on public.transfers (user_id, date desc);

alter table public.transfers enable row level security;

drop policy if exists "transfers_owner" on public.transfers;
create policy "transfers_owner" on public.transfers
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
