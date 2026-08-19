import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type KrakenCredentialStatus = {
  connected: boolean;
  apiKeyLast4: string | null;
  tradingEnabled: boolean;
  updatedAt: string | null;
};

export const getKrakenCredentialStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<KrakenCredentialStatus> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("kraken_credentials")
      .select("api_key_last4, trading_enabled, updated_at")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return {
      connected: Boolean(data),
      apiKeyLast4: data?.api_key_last4 ?? null,
      tradingEnabled: data?.trading_enabled ?? false,
      updatedAt: data?.updated_at ?? null,
    };
  });

export const saveKrakenCredentials = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { apiKey: string; privateKey: string; tradingEnabled?: boolean }) => {
    const apiKey = input.apiKey.trim();
    const privateKey = input.privateKey.trim();
    if (apiKey.length < 10) throw new Error("That API key looks too short.");
    if (privateKey.length < 20) throw new Error("That private key looks too short.");
    return { apiKey, privateKey, tradingEnabled: input.tradingEnabled === true };
  })
  .handler(async ({ data, context }): Promise<{ ok: true; apiKeyLast4: string }> => {
    const { encryptSecret } = await import("./credentials-crypto.server");
    const { callKrakenPrivate } = await import("./kraken-private.server");

    // Validate the credentials against Kraken before persisting them.
    try {
      await callKrakenPrivate("Balance", data.apiKey, data.privateKey);
    } catch (error) {
      throw new Error(
        `Kraken rejected these credentials: ${error instanceof Error ? error.message : "unknown error"}`,
      );
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const apiKeyLast4 = data.apiKey.slice(-4);
    const { error } = await supabaseAdmin.from("kraken_credentials").upsert(
      {
        user_id: context.userId,
        api_key_last4: apiKeyLast4,
        api_key_ciphertext: encryptSecret(data.apiKey),
        private_key_ciphertext: encryptSecret(data.privateKey),
        trading_enabled: data.tradingEnabled,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true, apiKeyLast4 };
  });

export const removeKrakenCredentials = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ ok: true }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("kraken_credentials")
      .delete()
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const ALLOWED_ENDPOINTS = ["Balance", "OpenOrders", "ClosedOrders", "Ledgers", "TradeBalance"] as const;

/** Server-side proxy: decrypts stored keys and calls Kraken. Secrets never reach the browser. */
export const krakenPrivateRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { endpoint: string; params?: Record<string, string> }) => {
    if (!(ALLOWED_ENDPOINTS as readonly string[]).includes(input.endpoint)) {
      throw new Error(`Endpoint "${input.endpoint}" is not allowed.`);
    }
    return { endpoint: input.endpoint, params: input.params ?? {} };
  })
  .handler(async ({ data, context }): Promise<unknown> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("kraken_credentials")
      .select("api_key_ciphertext, private_key_ciphertext")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("No Kraken credentials connected.");

    const { decryptSecret } = await import("./credentials-crypto.server");
    const { callKrakenPrivate } = await import("./kraken-private.server");
    return callKrakenPrivate(
      data.endpoint,
      decryptSecret(row.api_key_ciphertext),
      decryptSecret(row.private_key_ciphertext),
      data.params,
    );
  });