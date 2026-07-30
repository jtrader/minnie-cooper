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

type Failure = { error: { kind: string; message: string } };

function toFailure(error: unknown): Failure {
  if (error instanceof KrakenApiError) {
    return { error: { kind: error.kind, message: error.message } };
  }
  return { error: { kind: "api", message: "Unexpected error talking to Kraken." } };
}

export const fetchKrakenBalances = createServerFn({ method: "GET" }).handler(async () => {
  try {
    return { rows: mapBalances(await krakenPrivate("Balance")) };
  } catch (error) {
    return { rows: [], ...toFailure(error) };
  }
});

export const fetchKrakenTicker = createServerFn({ method: "GET" })
  .inputValidator((input: { pairs: string }) => ({
    pairs: String(input?.pairs ?? "XBTUSD").slice(0, 200),
  }))
  .handler(async ({ data }) => {
    try {
      return { rows: mapTicker(await krakenPublic("Ticker", { pair: data.pairs })) };
    } catch (error) {
      return { rows: [], ...toFailure(error) };
    }
  });

export const fetchKrakenActivity = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const [tradesResult, ordersResult] = await Promise.all([
      krakenPrivate("TradesHistory"),
      krakenPrivate("OpenOrders"),
    ]);
    return { rows: [...mapOrders(ordersResult), ...mapTrades(tradesResult)].slice(0, 100) };
  } catch (error) {
    return { rows: [], ...toFailure(error) };
  }
});