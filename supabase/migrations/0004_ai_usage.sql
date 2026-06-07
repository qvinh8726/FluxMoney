-- =====================================================================
-- Hạn mức sử dụng AI theo ngày (ai_usage)
-- Mỗi user có một dòng đếm số lượt gọi /api/ai mỗi ngày. Dùng để
-- rate-limit, tránh lạm dụng và đốt credit của nhà cung cấp AI khi public.
-- =====================================================================

create table if not exists public.ai_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  day     date not null default current_date,
  count   int  not null default 0,
  primary key (user_id, day)
);

alter table public.ai_usage enable row level security;

-- Người dùng chỉ thấy/sửa dòng đếm của chính mình.
drop policy if exists "ai_usage_owner" on public.ai_usage;
create policy "ai_usage_owner" on public.ai_usage
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Tăng bộ đếm một cách atomic và trả về kết quả cho phép/không.
-- security definer để ghi đếm ổn định; vẫn dùng auth.uid() nên chỉ
-- tác động đúng người gọi — không thể đếm hộ người khác.
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

  select count into v_count
    from public.ai_usage
    where user_id = v_uid and day = current_date;
  v_count := coalesce(v_count, 0);

  if v_count >= p_limit then
    return jsonb_build_object('allowed', false, 'used', v_count, 'limit', p_limit);
  end if;

  insert into public.ai_usage (user_id, day, count)
    values (v_uid, current_date, 1)
    on conflict (user_id, day)
    do update set count = ai_usage.count + 1
    returning count into v_count;

  return jsonb_build_object('allowed', true, 'used', v_count, 'limit', p_limit);
end;
$$;
