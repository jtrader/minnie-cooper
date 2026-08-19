CREATE TABLE public.ibkr_settings (
  user_id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  gateway_base_url text NOT NULL DEFAULT 'https://localhost:5000/v1/api',
  default_account_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ibkr_settings TO authenticated;
GRANT ALL ON public.ibkr_settings TO service_role;

ALTER TABLE public.ibkr_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own IBKR settings"
ON public.ibkr_settings FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "service role manages ibkr settings"
ON public.ibkr_settings FOR ALL TO service_role USING (true) WITH CHECK (true);