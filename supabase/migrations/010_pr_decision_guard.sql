-- 010 — PR decision guard
-- Requesters may edit their own pending PR (RLS allows owner updates so they can
-- fix items/notes), but they must NOT be able to approve/reject it themselves.
-- RLS can't restrict a single column, so enforce the transition in a trigger:
-- moving a PR to approved/rejected requires manager/admin. A null auth.uid()
-- (trusted server / service role) is allowed.

create or replace function guard_pr_decision()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status in ('approved', 'rejected')
     and old.status is distinct from new.status
     and auth.uid() is not null
     and not has_role(array['manager', 'admin']::user_role[])
  then
    raise exception 'only a manager or admin may approve or reject a purchase request';
  end if;
  return new;
end;
$$;

create trigger purchase_requests_decision_guard
  before update of status on purchase_requests
  for each row execute function guard_pr_decision();
