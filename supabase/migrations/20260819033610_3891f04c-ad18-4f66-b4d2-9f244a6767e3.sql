CREATE TABLE public.kraken_credentials (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  api_key_last4 text NOT NULL,
  api_key_ciphertext text NOT NULL,
  private_key_ciphertext text NOT NULL,
  trading_enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.kraken_credentials TO service_role;
ALTER TABLE public.kraken_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service role manages kraken credentials"
ON public.kraken_credentials FOR ALL TO service_role
USING (true) WITH CHECK (true);