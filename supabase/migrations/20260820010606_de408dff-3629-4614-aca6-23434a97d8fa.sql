CREATE TABLE public.mt5_credentials (
  user_id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  broker_server text NOT NULL,
  login text NOT NULL,
  password_ciphertext text NOT NULL,
  region text NOT NULL DEFAULT 'new-york',
  metaapi_account_id text,
  connection_status text NOT NULL DEFAULT 'pending',
  trading_enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.mt5_credentials TO service_role;

ALTER TABLE public.mt5_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service role manages mt5 credentials"
ON public.mt5_credentials FOR ALL TO service_role USING (true) WITH CHECK (true);