-- 002 — Identity & org
-- profiles (1:1 with auth.users), departments, projects.

-- Shared updated_at maintainer, reused by every table with that column.
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table profiles (
  id                uuid primary key references auth.users (id) on delete cascade,
  full_name         text,
  role              user_role not null default 'employee',
  telegram_id       bigint unique,
  telegram_username text,
  department        text,
  active            boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create trigger profiles_updated_at before update on profiles
  for each row execute function set_updated_at();

create table departments (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  active     boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger departments_updated_at before update on departments
  for each row execute function set_updated_at();

create table projects (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  active     boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger projects_updated_at before update on projects
  for each row execute function set_updated_at();

-- Auto-create a profile when an auth user is created (web sign-up or admin API).
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, full_name, telegram_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    nullif(new.raw_user_meta_data ->> 'telegram_id', '')::bigint
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- Guard: only an admin (or a trusted server using the service role, where
-- auth.uid() is null) may change a profile's role.
create or replace function guard_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role
     and auth.uid() is not null
     and not exists (
       select 1 from profiles
       where id = auth.uid() and role = 'admin' and active
     )
  then
    raise exception 'only an admin may change a profile role';
  end if;
  return new;
end;
$$;

create trigger profiles_guard_role before update on profiles
  for each row execute function guard_profile_role();
