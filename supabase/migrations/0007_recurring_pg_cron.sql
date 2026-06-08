-- =====================================================================
-- Sinh giao dịch định kỳ phía SERVER bằng pg_cron.
--
-- Trước đây generateDueRecurring chỉ chạy ở client: nếu user không mở app
-- thì không có giao dịch nào được sinh. Migration này chuyển cơ chế sinh
-- sang server — một function chạy hằng ngày qua pg_cron, độc lập với việc
-- user có online hay không.
--
-- Bản client vẫn được giữ để phản hồi tức thì khi user vừa thêm/sửa quy tắc;
-- cả hai đều idempotent nhờ unique (source_rule_id, date) ở 0005, nên dù
-- chạy chồng nhau cũng không sinh giao dịch trùng.
-- =====================================================================

create extension if not exists pg_cron;

-- Mốc kỳ kế tiếp theo tần suất (logic khớp nextOccurrence ở client).
create or replace function public.recurring_next(d date, freq text)
returns date
language sql
immutable
as $$
  select (case freq
    when 'daily'   then d + interval '1 day'
    when 'weekly'  then d + interval '1 week'
    when 'monthly' then d + interval '1 month'
    else                d + interval '1 year'
  end)::date;
$$;

-- Sinh mọi giao dịch định kỳ tới hạn cho TẤT CẢ người dùng.
-- security definer + bỏ qua RLS để cron (không có auth.uid()) vẫn ghi được;
-- vẫn an toàn vì chỉ ghi đúng user_id của từng quy tắc.
create or replace function public.generate_due_recurring()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today    date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
  v_rule     record;
  v_cursor   date;
  v_last     date;
  v_currency text;
  v_inserted int := 0;
  v_guard    int;
begin
  for v_rule in
    select * from public.recurring_rules where paused = false
  loop
    select coalesce(base_currency, 'VND') into v_currency
      from public.profiles where id = v_rule.user_id;
    v_currency := coalesce(v_currency, 'VND');

    v_cursor := case
      when v_rule.last_generated_date is not null
        then public.recurring_next(v_rule.last_generated_date, v_rule.frequency)
      else v_rule.start_date
    end;
    v_last  := v_rule.last_generated_date;
    v_guard := 0;

    while v_cursor <= v_today and v_guard < 1000 loop
      if v_rule.end_date is not null and v_cursor > v_rule.end_date then
        exit;
      end if;

      insert into public.transactions
        (user_id, type, amount, date, account_id, category_id, note, currency, source_rule_id)
      values
        (v_rule.user_id, v_rule.type, v_rule.amount, v_cursor, v_rule.account_id,
         v_rule.category_id, coalesce(v_rule.note, 'Định kỳ'), v_currency, v_rule.id)
      on conflict (source_rule_id, date) do nothing;

      if found then
        v_inserted := v_inserted + 1;
      end if;

      v_last   := v_cursor;
      v_cursor := public.recurring_next(v_cursor, v_rule.frequency);
      v_guard  := v_guard + 1;
    end loop;

    if v_last is distinct from v_rule.last_generated_date then
      update public.recurring_rules
        set last_generated_date = v_last
        where id = v_rule.id;
    end if;
  end loop;

  return v_inserted;
end;
$$;

-- Lên lịch chạy hằng ngày lúc 00:05 giờ Việt Nam (= 17:05 UTC hôm trước).
-- pg_cron dùng giờ UTC; function tự quy mốc "hôm nay" theo Asia/Ho_Chi_Minh
-- nên chạy ở thời điểm nào cũng sinh đúng tới ngày VN hiện tại.
-- Gỡ lịch cũ trước (nếu có) để migration chạy lại được nhiều lần.
do $$
begin
  if exists (select 1 from cron.job where jobname = 'generate-due-recurring') then
    perform cron.unschedule('generate-due-recurring');
  end if;
  perform cron.schedule(
    'generate-due-recurring',
    '5 17 * * *',
    $cron$ select public.generate_due_recurring(); $cron$
  );
end;
$$;
