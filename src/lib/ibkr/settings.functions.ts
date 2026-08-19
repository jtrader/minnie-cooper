import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type IbkrSettings = {
  configured: boolean;
  gatewayBaseUrl: string;
  defaultAccountId: string | null;
  updatedAt: string | null;
};

const FALLBACK_URL = "https://localhost:5000/v1/api";

export const getIbkrSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<IbkrSettings> => {
    const { data, error } = await context.supabase
      .from("ibkr_settings")
      .select("gateway_base_url, default_account_id, updated_at")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return {
      configured: Boolean(data),
      gatewayBaseUrl: data?.gateway_base_url ?? FALLBACK_URL,
      defaultAccountId: data?.default_account_id ?? null,
      updatedAt: data?.updated_at ?? null,
    };
  });

export const saveIbkrSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { gatewayBaseUrl: string; defaultAccountId?: string | null }) => {
    const gatewayBaseUrl = input.gatewayBaseUrl.trim().replace(/\/+$/, "");
    let parsed: URL;
    try {
      parsed = new URL(gatewayBaseUrl);
    } catch {
      throw new Error("Enter a full gateway URL, e.g. https://localhost:5000/v1/api");
    }
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      throw new Error("The gateway URL must start with https:// or http://");
    }
    const defaultAccountId = input.defaultAccountId?.trim() || null;
    if (defaultAccountId && defaultAccountId.length > 32) throw new Error("Account id looks invalid.");
    return { gatewayBaseUrl, defaultAccountId };
  })
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    const { error } = await context.supabase.from("ibkr_settings").upsert(
      {
        user_id: context.userId,
        gateway_base_url: data.gatewayBaseUrl,
        default_account_id: data.defaultAccountId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const removeIbkrSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ ok: true }> => {
    const { error } = await context.supabase
      .from("ibkr_settings")
      .delete()
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
