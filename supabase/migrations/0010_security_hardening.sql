-- =====================================================================
-- Migration 0010: Vá bảo mật trước khi public.
--
-- 1. RLS cross-tenant: FK không tôn trọng RLS, nên WITH CHECK phải tự
--    xác minh account_id/category_id thuộc về chính user — nếu không,
--    user có thể chèn transaction/budget trỏ sang dữ liệu người khác.
-- 2. REVOKE các SECURITY DEFINER function khỏi anon/authenticated để
--    không bị gọi tùy tiện qua PostgREST RPC.
-- 3. bump_ai_usage: gộp check + increment thành một câu atomic, tránh
--    race khi nhiều request đồng thời vượt qua hạn mức.
-- 4. Ràng buộc end_date >= start_date cho recurring_rules.
-- 5. Index user_id cho push_subscriptions.
-- =====================================================================

-- ---- 1. RLS cross-tenant cho transactions ----
drop policy if exists "transactions_owner" on public.transactions;
create policy "transactions_owner" on public.transactions
  for all
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and account_id in (select id from public.accounts where user_id = auth.uid())
    and (
      category_id is null
      or category_id in (select id from public.categories where user_id = auth.uid())
    )
  );

-- ---- 1b. RLS cross-tenant cho budgets ----
drop policy if exists "budgets_owner" on public.budgets;
create policy "budgets_owner" on public.budgets
  for all
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and category_id in (select id from public.categories where user_id = auth.uid())
  );

-- ---- 2. Khóa quyền gọi RPC tới các SECURITY DEFINER function ----
-- generate_due_recurring chỉ dành cho cron (owner); recurring_next là helper.
revoke all on function public.generate_due_recurring() from public, anon, authenticated;
revoke all on function public.recurring_next(date, text) from public, anon, authenticated;

-- ---- 3. bump_ai_usage atomic: check + increment trong một câu ----
create or replace function public.bump_ai_usage(p_limit int)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid   uuid := auth.uid();
  v_count int;
begin
  if v_uid is null then
    return jsonb_build_object('allowed', false, 'used', 0, 'reason', 'unauthenticated');
  end if;

  -- Chỉ tăng khi còn dưới hạn mức. Nếu đã chạm/vượt, câu UPDATE điều kiện
  -- không khớp dòng nào → v_count trả về NULL → từ chối. Toàn bộ là một
  -- câu atomic nên nhiều request đồng thời không thể cùng vượt hạn mức.
  insert into public.ai_usage (user_id, day, count)
    values (v_uid, current_date, 1)
    on conflict (user_id, day)
    do update set count = ai_usage.count + 1
      where ai_usage.count < p_limit
    returning count into v_count;

  if v_count is null then
    -- Dòng đã tồn tại và đã ở/quá hạn mức: lấy lại số đếm hiện tại để báo.
    select count into v_count
      from public.ai_usage
      where user_id = v_uid and day = current_date;
    return jsonb_build_object('allowed', false, 'used', coalesce(v_count, 0), 'limit', p_limit);
  end if;

  return jsonb_build_object('allowed', true, 'used', v_count, 'limit', p_limit);
end;
$$;

-- ---- 4. Ràng buộc end_date >= start_date cho recurring_rules ----
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'recurring_rules_date_range_chk'
  ) then
    alter table public.recurring_rules
      add constraint recurring_rules_date_range_chk
      check (end_date is null or end_date >= start_date);
  end if;
end;
$$;

-- ---- 5. Index user_id cho push_subscriptions ----
create index if not exists push_subscriptions_user_id_idx
  on public.push_subscriptions (user_id);

-- ---- 6. Hoàn lượt AI khi gọi nhà cung cấp thất bại ----
-- bump_ai_usage trừ lượt TRƯỚC khi gọi OpenAI. Nếu provider lỗi (không sinh
-- được phân tích), route gọi hàm này để hoàn lại một lượt cho đúng ngày,
-- tránh trừ oan. Không bao giờ giảm xuống dưới 0.
create or replace function public.refund_ai_usage()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    return;
  end if;
  update public.ai_usage
    set count = greatest(count - 1, 0)
    where user_id = v_uid and day = current_date;
end;
$$;
