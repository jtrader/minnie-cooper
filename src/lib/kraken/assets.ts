/**
 * Kraken uses legacy X/Z prefixed asset codes (XXBT, ZUSD) plus staking/earn
 * suffixes (.S, .M, .F). Map them to human labels for the balances table.
 */
const EXPLICIT: Record<string, string> = {
  XXBT: "BTC",
  XBT: "BTC",
  XETH: "ETH",
  XXDG: "DOGE",
  XDG: "DOGE",
  XXRP: "XRP",
  XLTC: "LTC",
  XXLM: "XLM",
  XZEC: "ZEC",
  XETC: "ETC",
  XREP: "REP",
  XMLN: "MLN",
  ZUSD: "USD",
  ZEUR: "EUR",
  ZGBP: "GBP",
  ZAUD: "AUD",
  ZCAD: "CAD",
  ZJPY: "JPY",
};

const SUFFIX_LABEL: Record<string, string> = {
  S: "staked",
  M: "rewards",
  F: "earn",
  B: "bonded",
  P: "auto-earn",
};

export function formatKrakenAsset(code: string): string {
  const [base = code, suffix] = code.split(".");
  const mapped = EXPLICIT[base] ?? base;
  const note = suffix ? SUFFIX_LABEL[suffix.toUpperCase()] ?? suffix.toLowerCase() : null;
  return note ? `${mapped} (${note})` : mapped;
}