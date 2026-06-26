alter table profiles
  add column if not exists telegram_link_token text unique,
  add column if not exists telegram_link_expires_at timestamptz;

create index if not exists profiles_telegram_link_token_idx
  on profiles (telegram_link_token)
  where telegram_link_token is not null;
