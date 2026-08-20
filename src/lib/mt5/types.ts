export const MT5_REGIONS = ["new-york", "london", "singapore", "tokyo", "sydney"] as const;
export type Mt5Region = (typeof MT5_REGIONS)[number];

export type Mt5CredentialStatus = {
  connected: boolean;
  brokerServer: string | null;
  loginMasked: string | null;
  region: Mt5Region | null;
  metaapiAccountId: string | null;
  connectionStatus: string | null;
  tradingEnabled: boolean;
  updatedAt: string | null;
};

export type Mt5AccountSummary = {
  broker: string | null;
  currency: string | null;
  server: string | null;
  balance: number | null;
  equity: number | null;
  margin: number | null;
  freeMargin: number | null;
  marginLevel: number | null;
  leverage: number | null;
};

export type Mt5Position = {
  id: string;
  symbol: string;
  type: string;
  volume: number | null;
  openPrice: number | null;
  currentPrice: number | null;
  profit: number | null;
  swap: number | null;
  time: string | null;
};

export type Mt5Order = {
  id: string;
  symbol: string;
  type: string;
  volume: number | null;
  price: number | null;
  profit: number | null;
  state: string | null;
  time: string | null;
};
