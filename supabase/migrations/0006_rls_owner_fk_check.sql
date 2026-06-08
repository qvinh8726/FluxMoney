-- =====================================================================
-- Siết RLS: ràng buộc khóa ngoại phải thuộc về chính chủ sở hữu.
--
-- Trước đây các policy chỉ kiểm `auth.uid() = user_id` trong WITH CHECK,
-- nên user A có thể chèn/sửa bản ghi trỏ account_id/category_id của user B
-- (lỗi TOÀN VẸN dữ liệu — không leak vì đọc vẫn lọc theo user_id, nhưng
-- vẫn cho phép ghi dữ liệu rác vào ví người khác).
--
-- Migration này tăng cường WITH CHECK để mọi FK (ví, danh mục, quy tắc)
-- đều phải tồn tại và thuộc về auth.uid(). USING giữ nguyên (lọc user_id)
-- vì đọc/sửa/xóa đã được cô lập theo user_id từ trước.
-- =====================================================================

-- ---- transactions: account_id (bắt buộc), category_id, source_rule_id ----
drop policy if exists "transactions_owner" on public.transactions;
create policy "transactions_owner" on public.transactions
  for all
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.accounts a
      where a.id = account_id and a.user_id = auth.uid()
    )
    and (
      category_id is null
      or exists (
        select 1 from public.categories c
        where c.id = category_id and c.user_id = auth.uid()
      )
    )
    and (
      source_rule_id is null
      or exists (
        select 1 from public.recurring_rules r
        where r.id = source_rule_id and r.user_id = auth.uid()
      )
    )
  );

-- ---- transfers: from_account_id + to_account_id (cả hai bắt buộc) ----
drop policy if exists "transfers_owner" on public.transfers;
create policy "transfers_owner" on public.transfers
  for all
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.accounts a
      where a.id = from_account_id and a.user_id = auth.uid()
    )
    and exists (
      select 1 from public.accounts a
      where a.id = to_account_id and a.user_id = auth.uid()
    )
  );

-- ---- recurring_rules: account_id (bắt buộc), category_id ----
drop policy if exists "recurring_owner" on public.recurring_rules;
create policy "recurring_owner" on public.recurring_rules
  for all
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.accounts a
      where a.id = account_id and a.user_id = auth.uid()
    )
    and (
      category_id is null
      or exists (
        select 1 from public.categories c
        where c.id = category_id and c.user_id = auth.uid()
      )
    )
  );

-- ---- budgets: category_id (bắt buộc) ----
drop policy if exists "budgets_owner" on public.budgets;
create policy "budgets_owner" on public.budgets
  for all
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.categories c
      where c.id = category_id and c.user_id = auth.uid()
    )
  );
