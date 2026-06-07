-- =====================================================================
-- Cash Flow Calendar — Schema khởi tạo + Row Level Security (RLS)
-- Mô hình: mỗi người dùng (auth.users) sở hữu dữ liệu riêng (tenant = user).
-- RLS đảm bảo cô lập tuyệt đối giữa các người dùng.
-- =====================================================================

-- ---- Bảng hồ sơ người dùng (1-1 với auth.users) ----
create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  display_name  text,
  base_currency text not null default 'VND',
  created_at    timestamptz not null default now()
);

-- ---- Ví / Tài khoản ----
create table if not exists public.accounts (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  name            text not null check (char_length(name) between 1 and 100),
  kind            text not null default 'cash'
                    check (kind in ('cash','bank','ewallet','credit','other')),
  initial_balance numeric(14,2) not null default 0,
  currency        text not null default 'VND',
  color           text not null default '#2563EB',
  created_at      timestamptz not null default now()
);

-- ---- Danh mục thu/chi ----
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 50),
  type        text not null check (type in ('income','expense')),
  icon        text not null default 'Tag',
  color       text not null default '#94A3B8',
  is_default  boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Chống trùng tên cùng loại trong cùng người dùng (không phân biệt hoa thường)
create unique index if not exists categories_user_type_name_uidx
  on public.categories (user_id, type, lower(name));

-- ---- Giao dịch ----
create table if not exists public.transactions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  type        text not null check (type in ('income','expense')),
  amount      numeric(14,2) not null check (amount >= 0.01 and amount <= 999999999.99),
  date        date not null,
  account_id  uuid not null references public.accounts (id) on delete cascade,
  category_id uuid references public.categories (id) on delete set null,
  note        text,
  currency    text not null default 'VND',
  created_at  timestamptz not null default now()
);

create index if not exists transactions_user_date_idx
  on public.transactions (user_id, date desc);
create index if not exists transactions_account_idx
  on public.transactions (account_id);

-- ---- Ngân sách ----
create table if not exists public.budgets (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  amount      numeric(14,2) not null check (amount >= 0.01 and amount <= 999999999.99),
  period      text not null default 'monthly'
                check (period in ('monthly','quarterly','yearly')),
  created_at  timestamptz not null default now(),
  unique (user_id, category_id, period)
);

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table public.profiles      enable row level security;
alter table public.accounts      enable row level security;
alter table public.categories    enable row level security;
alter table public.transactions  enable row level security;
alter table public.budgets       enable row level security;

-- profiles: chủ sở hữu là chính id
drop policy if exists "profiles_self" on public.profiles;
create policy "profiles_self" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- Macro chung cho các bảng có user_id
drop policy if exists "accounts_owner" on public.accounts;
create policy "accounts_owner" on public.accounts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "categories_owner" on public.categories;
create policy "categories_owner" on public.categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "transactions_owner" on public.transactions;
create policy "transactions_owner" on public.transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "budgets_owner" on public.budgets;
create policy "budgets_owner" on public.budgets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =====================================================================
-- Tự khởi tạo dữ liệu mặc định khi có người dùng mới
-- (hồ sơ + ví tiền mặt + danh mục thu/chi mặc định)
-- =====================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email));

  insert into public.accounts (user_id, name, kind, initial_balance, color)
  values (new.id, 'Tiền mặt', 'cash', 0, '#22C55E');

  insert into public.categories (user_id, name, type, color, is_default) values
    (new.id, 'Lương',     'income',  '#22C55E', true),
    (new.id, 'Thưởng',    'income',  '#10B981', true),
    (new.id, 'Đầu tư',    'income',  '#0EA5E9', true),
    (new.id, 'Ăn uống',   'expense', '#F97316', true),
    (new.id, 'Đi lại',    'expense', '#6366F1', true),
    (new.id, 'Mua sắm',   'expense', '#EC4899', true),
    (new.id, 'Hóa đơn',   'expense', '#EF4444', true),
    (new.id, 'Nhà cửa',   'expense', '#8B5CF6', true),
    (new.id, 'Sức khỏe',  'expense', '#14B8A6', true),
    (new.id, 'Giải trí',  'expense', '#F59E0B', true);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
