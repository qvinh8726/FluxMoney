-- =====================================================================
-- Chống sinh trùng giao dịch định kỳ ở tầng DB.
-- Mỗi quy tắc (recurring_rules) chỉ được sinh đúng MỘT giao dịch cho mỗi
-- ngày. Nếu nhiều phiên/tab chạy generateDueRecurring đồng thời, ON CONFLICT
-- DO NOTHING đảm bảo không tạo bản ghi trùng — last_generated_date phía client
-- chỉ là lớp tối ưu, đây mới là ràng buộc cứng.
-- =====================================================================

-- Nguồn gốc quy tắc của giao dịch (NULL = nhập tay). Khi xóa quy tắc, các
-- giao dịch đã sinh vẫn được giữ lại (set null) — khớp hành vi hiện tại.
alter table public.transactions
  add column if not exists source_rule_id uuid
    references public.recurring_rules (id) on delete set null;

-- Unique (source_rule_id, date): NULL được coi là khác nhau nên giao dịch
-- nhập tay không bị ràng buộc; chỉ các giao dịch sinh tự động mới chống trùng.
create unique index if not exists transactions_source_rule_date_uidx
  on public.transactions (source_rule_id, date);
