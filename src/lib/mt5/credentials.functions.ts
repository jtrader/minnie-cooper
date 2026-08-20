import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  MT5_REGIONS,
  type Mt5AccountSummary,
  type Mt5CredentialStatus,
  type Mt5Order,
  type Mt5Position,
  type Mt5Region,
} from "./types";

export type { Mt5CredentialStatus } from "./types";

const isRegion = (value: unknown): value is Mt5Region =>
  typeof value === "string" && (MT5_REGIONS as readonly string[]).includes(value);

export const getMt5CredentialStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Mt5CredentialStatus> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("mt5_credentials")
      .select("broker_server, login, region, metaapi_account_id, connection_status, trading_enabled, updated_at")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return {
      connected: Boolean(data),
      brokerServer: data?.broker_server ?? null,
      loginMasked: data?.login ? `····${data.login.slice(-4)}` : null,
      region: isRegion(data?.region) ? data.region : null,
      metaapiAccountId: data?.metaapi_account_id ?? null,
      connectionStatus: data?.connection_status ?? null,
      tradingEnabled: data?.trading_enabled ?? false,
      updatedAt: data?.updated_at ?? null,
    };
  });

export const saveMt5Credentials = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      brokerServer: string;
      login: string;
      password: string;
      region?: string;
      tradingEnabled?: boolean;
    }) => {
      const brokerServer = input.brokerServer.trim();
      const login = input.login.trim();
      const password = input.password;
      if (brokerServer.length < 3) throw new Error("Enter your broker's MT5 server name.");
      if (!/^\d{4,}$/.test(login)) throw new Error("Login should be your MT5 account number.");
      if (password.length < 4) throw new Error("That investor/trading password looks too short.");
      const region: Mt5Region = isRegion(input.region) ? input.region : "new-york";
      return { brokerServer, login, password, region, tradingEnabled: input.tradingEnabled === true };
    },
  )
  .handler(async ({ data, context }): Promise<{ ok: true; accountId: string }> => {
    const { encryptSecret } = await import("./credentials-crypto.server");
    const bridge = await import("./mt5-bridge.server");

    // Validate against MetaApi before persisting anything.
    let accountId: string;
    try {
      accountId = await bridge.provisionAccount({
        login: data.login,
        password: data.password,
        brokerServer: data.brokerServer,
        region: data.region,
        name: `mc-${context.userId.slice(0, 8)}-${data.login}`,
      });
      await bridge.deployAccount(accountId);
    } catch (error) {
      throw new Error(
        `MetaApi rejected these credentials: ${error instanceof Error ? error.message : "unknown error"}`,
      );
    }

    const state = await bridge.getAccountState(accountId).catch(() => ({ connectionStatus: null }));

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("mt5_credentials").upsert(
      {
        user_id: context.userId,
        broker_server: data.brokerServer,
        login: data.login,
        password_ciphertext: encryptSecret(data.password),
        region: data.region,
        metaapi_account_id: accountId,
        connection_status: state.connectionStatus ?? "deploying",
        trading_enabled: data.tradingEnabled,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true, accountId };
  });

export const removeMt5Credentials = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ ok: true }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("mt5_credentials")
      .select("metaapi_account_id")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (data?.metaapi_account_id) {
      const { removeAccount } = await import("./mt5-bridge.server");
      await removeAccount(data.metaapi_account_id);
    }
    const { error } = await supabaseAdmin
      .from("mt5_credentials")
      .delete()
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export type Mt5RequestResult = {
  summary?: Mt5AccountSummary;
  positions?: Mt5Position[];
  orders?: Mt5Order[];
  connectionStatus?: string | null;
};

/** Server-side proxy: decrypts nothing to the browser and calls MetaApi on the user's behalf. */
export const mt5Request = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { resource: "summary" | "positions" | "orders" | "status" }) => {
    const allowed = ["summary", "positions", "orders", "status"];
    if (!allowed.includes(input.resource)) throw new Error("Unsupported MT5 resource.");
    return { resource: input.resource };
  })
  .handler(async ({ data, context }): Promise<Mt5RequestResult> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("mt5_credentials")
      .select("metaapi_account_id, region")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row?.metaapi_account_id) throw new Error("No MetaTrader 5 account connected.");
    const region: Mt5Region = isRegion(row.region) ? row.region : "new-york";
    const accountId = row.metaapi_account_id;
    const bridge = await import("./mt5-bridge.server");

    if (data.resource === "status") {
      const state = await bridge.getAccountState(accountId);
      await supabaseAdmin
        .from("mt5_credentials")
        .update({ connection_status: state.connectionStatus ?? "unknown" })
        .eq("user_id", context.userId);
      return { connectionStatus: state.connectionStatus };
    }
    if (data.resource === "summary") {
      return { summary: await bridge.fetchAccountSummary(accountId, region) };
    }
    if (data.resource === "positions") {
      return { positions: await bridge.fetchPositions(accountId, region) };
    }
    return { orders: await bridge.fetchRecentOrders(accountId, region) };
  });
