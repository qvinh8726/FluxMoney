-- =====================================================================
-- Giao dịch định kỳ (recurring_rules)
-- Mỗi quy tắc tự sinh giao dịch theo tần suất. Cột last_generated_date
-- đảm bảo mỗi kỳ chỉ sinh đúng một lần (idempotent).
-- =====================================================================

create table if not exists public.recurring_rules (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users (id) on delete cascade,
  type                text not null check (type in ('income','expense')),
  amount              numeric(14,2) not null check (amount >= 0.01 and amount <= 999999999.99),
  account_id          uuid not null references public.accounts (id) on delete cascade,
  category_id         uuid references public.categories (id) on delete set null,
  frequency           text not null check (frequency in ('daily','weekly','monthly','yearly')),
  start_date          date not null,
  end_date            date,
  note                text,
  paused              boolean not null default false,
  last_generated_date date,
  created_at          timestamptz not null default now()
);

create index if not exists recurring_user_idx
  on public.recurring_rules (user_id);

alter table public.recurring_rules enable row level security;

drop policy if exists "recurring_owner" on public.recurring_rules;
create policy "recurring_owner" on public.recurring_rules
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
