export type IbkrErrorKind = "unreachable" | "auth" | "http" | "parse";

export class IbkrError extends Error {
  readonly kind: IbkrErrorKind;
  readonly status?: number;

  constructor(kind: IbkrErrorKind, message: string, status?: number) {
    super(message);
    this.name = "IbkrError";
    this.kind = kind;
    this.status = status;
  }
}

export type IbkrAuthStatus = {
  authenticated: boolean;
  connected: boolean;
  competing: boolean;
  message: string | null;
};

export type IbkrAccount = {
  id: string;
  accountId: string;
  displayName: string;
  type: string | null;
};

export type IbkrLedgerRow = {
  currency: string;
  cashBalance: number | null;
  netLiquidation: number | null;
  unrealizedPnl: number | null;
  realizedPnl: number | null;
};

export type IbkrPnlRow = {
  key: string;
  dailyPnl: number | null;
  unrealizedPnl: number | null;
  realizedPnl: number | null;
  netLiquidation: number | null;
};

export type IbkrPosition = {
  conid: number | null;
  contractDesc: string;
  position: number | null;
  avgPrice: number | null;
  marketPrice: number | null;
  marketValue: number | null;
  unrealizedPnl: number | null;
  currency: string;
};

export type IbkrOrder = {
  orderId: string;
  ticker: string;
  side: string;
  orderType: string;
  quantity: number | null;
  filled: number | null;
  price: number | null;
  status: string;
  lastExecTime: number | null;
};

export type IbkrTrade = {
  executionId: string;
  time: number | null;
  symbol: string;
  side: string;
  price: number | null;
  size: number | null;
  status: string;
};

export type IbkrContract = {
  conid: string;
  symbol: string;
  description: string;
  companyName: string;
  secType: string;
};

export type IbkrOrderDraft = {
  conid: string;
  symbol: string;
  side: "BUY" | "SELL";
  quantity: number;
  orderType: "MKT" | "LMT";
  limitPrice: number | null;
  tif: "DAY" | "GTC";
};

/** Reply prompt returned by IBKR before an order is accepted. */
export type IbkrOrderReply = {
  id: string;
  messages: string[];
};

export type IbkrPlaceResult =
  | { kind: "reply"; reply: IbkrOrderReply }
  | { kind: "placed"; orderId: string | null; status: string | null };
