import { createServerFn } from "@tanstack/react-start";
import {
  KrakenApiError,
  krakenPrivate,
  krakenPublic,
  mapBalances,
  mapOrders,
  mapTicker,
  mapTrades,
} from "./kraken-api.server";

type Failure = { error: { kind: string; message: string } | null };

function toFailure(error: unknown): Failure {
  if (error instanceof KrakenApiError) {
    return { error: { kind: error.kind, message: error.message } };
  }
  return { error: { kind: "api", message: "Unexpected error talking to Kraken." } };
}

export const fetchKrakenBalances = createServerFn({ method: "GET" }).handler(async () => {
  try {
    return { rows: mapBalances(await krakenPrivate("Balance")), error: null, ...{} } as {
      rows: ReturnType<typeof mapBalances>;
    } & Failure;
  } catch (error) {
    return { rows: [], ...toFailure(error) } as { rows: ReturnType<typeof mapBalances> } & Failure;
  }
});

export const fetchKrakenTicker = createServerFn({ method: "GET" })
  .inputValidator((input: { pairs: string }) => ({
    pairs: String(input?.pairs ?? "XBTUSD").slice(0, 200),
  }))
  .handler(async ({ data }) => {
    try {
      return { rows: mapTicker(await krakenPublic("Ticker", { pair: data.pairs })), error: null } as {
        rows: ReturnType<typeof mapTicker>;
      } & Failure;
    } catch (error) {
      return { rows: [], ...toFailure(error) } as { rows: ReturnType<typeof mapTicker> } & Failure;
    }
  });

export const fetchKrakenActivity = createServerFn({ method: "GET" }).handler(async () => {
  try {
    // Sequential: Kraken requires strictly increasing nonces per key,
    // and parallel requests can arrive out of order.
    const tradesResult = await krakenPrivate("TradesHistory");
    const ordersResult = await krakenPrivate("OpenOrders");
    return {
      rows: [...mapOrders(ordersResult), ...mapTrades(tradesResult)].slice(0, 100),
      error: null,
    } as { rows: ReturnType<typeof mapOrders> } & Failure;
  } catch (error) {
    return { rows: [], ...toFailure(error) } as { rows: ReturnType<typeof mapOrders> } & Failure;
  }
});