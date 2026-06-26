-- 018 — Sequential PR number for human-readable references
-- Adds a short auto-incrementing label (PR-0001, PR-0002, …) to purchase_requests

create sequence if not exists pr_number_seq start 1;

alter table purchase_requests
  add column if not exists pr_number text
    default 'PR-' || lpad(nextval('pr_number_seq')::text, 4, '0');

-- Back-fill existing rows (order by created_at to keep numbers logical)
do $$
declare
  r record;
begin
  for r in
    select id from purchase_requests order by created_at
  loop
    update purchase_requests
       set pr_number = 'PR-' || lpad(nextval('pr_number_seq')::text, 4, '0')
     where id = r.id and pr_number is null;
  end loop;
end;
$$;

alter table purchase_requests
  alter column pr_number set not null;
