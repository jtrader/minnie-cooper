create table if not exists public.mt5_credentials (
  user_id uuid primary key references auth.users(id) on delete cascade,
  broker_server text not null,
  login text not null,
  password_ciphertext text not null,
  region text not null default 'new-york',
  metaapi_account_id text,
  connection_status text not null default 'deploying',
  trading_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.mt5_credentials enable row level security;
alter table public.mt5_credentials force row level security;

-- No authenticated/user policies: only the server's service role may access credentials.
