-- Create atomic credit deduction function
create or replace function deduct_credits_if_available(email_param text, amount_param int)
returns json as $$
declare
  current_credits int;
begin
  select credits into current_credits from user_credits where email = email_param for update;
  if current_credits is null then
    return json_build_object('success', false);
  end if;
  if current_credits < amount_param then
    return json_build_object('success', false);
  end if;
  update user_credits set credits = current_credits - amount_param where email = email_param;
  return json_build_object('success', true);
end;
$$ language plpgsql security definer set search_path = public;