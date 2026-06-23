-- 009 — Role grants
-- Tables created via migrations don't inherit Supabase's default API grants, so
-- grant them explicitly. RLS still governs which ROWS anon/authenticated can
-- touch; service_role bypasses RLS for trusted server flows.

grant usage on schema public to anon, authenticated, service_role;

grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all functions in schema public to anon, authenticated, service_role;

-- Apply to objects created after this migration as well.
alter default privileges in schema public
  grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on functions to anon, authenticated, service_role;
