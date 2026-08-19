import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Loader2, Search, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useIbkrConnection } from "@/components/ibkr/ibkr-connection";
import { IbkrErrorNotice } from "@/components/ibkr/ibkr-status-notice";
import { confirmReply, placeOrder, searchContracts } from "@/lib/ibkr/gateway";
import type { IbkrContract, IbkrOrderDraft, IbkrOrderReply } from "@/lib/ibkr/types";

export function IbkrOrderForm() {
  const { baseUrl, authenticated, accountId } = useIbkrConnection();
  const queryClient = useQueryClient();

  const [symbol, setSymbol] = useState("");
  const [results, setResults] = useState<IbkrContract[]>([]);
  const [contract, setContract] = useState<IbkrContract | null>(null);
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [quantity, setQuantity] = useState("1");
  const [orderType, setOrderType] = useState<"MKT" | "LMT">("MKT");
  const [limitPrice, setLimitPrice] = useState("");
  const [tif, setTif] = useState<"DAY" | "GTC">("DAY");

  const [draft, setDraft] = useState<IbkrOrderDraft | null>(null);
  const [reply, setReply] = useState<IbkrOrderReply | null>(null);
  const [placed, setPlaced] = useState<string | null>(null);
  const [error, setError] = useState<unknown>(null);

  const searchMutation = useMutation({
    mutationFn: () => searchContracts(baseUrl, symbol.trim().toUpperCase()),
    onSuccess: (data) => {
      setResults(data);
      setError(null);
    },
    onError: (err: unknown) => setError(err),
  });

  const afterPlace = async () => {
    await queryClient.invalidateQueries({ queryKey: ["ibkr-orders", baseUrl] });
    await queryClient.invalidateQueries({ queryKey: ["ibkr-positions", baseUrl, accountId] });
  };

  const submitMutation = useMutation({
    mutationFn: async (payload: IbkrOrderDraft) => placeOrder(baseUrl, accountId as string, payload),
    onSuccess: async (result) => {
      setError(null);
      if (result.kind === "reply") {
        setReply(result.reply);
        return;
      }
      setPlaced(result.orderId ?? result.status ?? "submitted");
      setDraft(null);
      await afterPlace();
    },
    onError: (err: unknown) => setError(err),
  });

  const confirmMutation = useMutation({
    mutationFn: async (replyId: string) => confirmReply(baseUrl, replyId),
    onSuccess: async (result) => {
      setError(null);
      if (result.kind === "reply") {
        // IBKR can chain several confirmations; surface the next one.
        setReply(result.reply);
        return;
      }
      setReply(null);
      setDraft(null);
      setPlaced(result.orderId ?? result.status ?? "submitted");
      await afterPlace();
    },
    onError: (err: unknown) => setError(err),
  });

  const startOrder = (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setPlaced(null);
    if (!contract) {
      setError(new Error("Search and pick a contract first."));
      return;
    }
    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      setError(new Error("Enter a quantity greater than zero."));
      return;
    }
    const price = orderType === "LMT" ? Number(limitPrice) : null;
    if (orderType === "LMT" && (!Number.isFinite(price) || (price ?? 0) <= 0)) {
      setError(new Error("Enter a limit price."));
      return;
    }
    setDraft({
      conid: contract.conid,
      symbol: contract.symbol,
      side,
      quantity: qty,
      orderType,
      limitPrice: price,
      tif,
    });
  };

  const busy = submitMutation.isPending || confirmMutation.isPending;
  const disabled = !authenticated || !accountId;

  return (
    <section className="rounded-lg border border-border bg-card">
      <header className="flex items-center gap-2 border-b border-border px-3 py-2">
        <Send className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold tracking-tight">Place order</h3>
      </header>

      <div className="space-y-3 p-3">
        {disabled ? (
          <p className="text-xs text-muted-foreground">
            Sign in to the gateway and select an account to place orders.
          </p>
        ) : null}

        <div className="flex items-end gap-2">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="ibkr-symbol" className="text-xs">Symbol</Label>
            <Input
              id="ibkr-symbol"
              value={symbol}
              disabled={disabled}
              onChange={(e) => setSymbol(e.target.value)}
              placeholder="AAPL"
              className="font-mono text-xs uppercase"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || !symbol.trim() || searchMutation.isPending}
            onClick={() => searchMutation.mutate()}
          >
            {searchMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Search className="h-3.5 w-3.5" />
            )}
            Search
          </Button>
        </div>

        {results.length > 0 ? (
          <ul className="max-h-40 divide-y divide-border overflow-auto rounded-md border border-border">
            {results.map((item) => (
              <li key={item.conid}>
                <button
                  type="button"
                  onClick={() => {
                    setContract(item);
                    setResults([]);
                  }}
                  className="flex w-full items-center justify-between gap-2 px-2.5 py-1.5 text-left hover:bg-accent"
                >
                  <span className="font-mono text-xs text-foreground">{item.symbol}</span>
                  <span className="truncate text-[11px] text-muted-foreground">
                    {item.companyName || item.description}
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground">{item.secType}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        {contract ? (
          <p className="rounded-md border border-border bg-muted/30 px-3 py-2 font-mono text-[11px] text-muted-foreground">
            Contract · {contract.symbol} · conid {contract.conid}
            {contract.companyName ? ` · ${contract.companyName}` : ""}
          </p>
        ) : null}

        <form className="grid gap-3 sm:grid-cols-2" onSubmit={startOrder}>
          <div className="space-y-1.5">
            <Label className="text-xs">Side</Label>
            <Select value={side} onValueChange={(v) => setSide(v as "BUY" | "SELL")} disabled={disabled}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="BUY" className="text-xs">Buy</SelectItem>
                <SelectItem value="SELL" className="text-xs">Sell</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ibkr-qty" className="text-xs">Quantity</Label>
            <Input
              id="ibkr-qty"
              value={quantity}
              disabled={disabled}
              inputMode="decimal"
              onChange={(e) => setQuantity(e.target.value)}
              className="h-8 font-mono text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Order type</Label>
            <Select
              value={orderType}
              onValueChange={(v) => setOrderType(v as "MKT" | "LMT")}
              disabled={disabled}
            >
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="MKT" className="text-xs">Market</SelectItem>
                <SelectItem value="LMT" className="text-xs">Limit</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ibkr-limit" className="text-xs">Limit price</Label>
            <Input
              id="ibkr-limit"
              value={limitPrice}
              inputMode="decimal"
              disabled={disabled || orderType !== "LMT"}
              onChange={(e) => setLimitPrice(e.target.value)}
              placeholder={orderType === "LMT" ? "0.00" : "—"}
              className="h-8 font-mono text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Time in force</Label>
            <Select value={tif} onValueChange={(v) => setTif(v as "DAY" | "GTC")} disabled={disabled}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="DAY" className="text-xs">Day</SelectItem>
                <SelectItem value="GTC" className="text-xs">Good till cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button type="submit" className="w-full" disabled={disabled || busy}>
              Review order
            </Button>
          </div>
        </form>

        {placed ? (
          <p className="rounded-md border border-primary/40 bg-primary/10 px-3 py-2 font-mono text-[11px] text-foreground">
            Order submitted · {placed}
          </p>
        ) : null}
        {error ? <IbkrErrorNotice error={error} /> : null}
      </div>

      <Dialog
        open={Boolean(draft)}
        onOpenChange={(next) => {
          if (!next && !busy) {
            setDraft(null);
            setReply(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Confirm live order
            </DialogTitle>
          </DialogHeader>

          {draft ? (
            <dl className="space-y-1 rounded-md border border-border bg-muted/30 px-3 py-2 font-mono text-[11px]">
              <div className="flex justify-between"><dt className="text-muted-foreground">Account</dt><dd>{accountId}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Symbol</dt><dd>{draft.symbol} ({draft.conid})</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Side</dt><dd>{draft.side}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Quantity</dt><dd>{draft.quantity}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Type</dt><dd>{draft.orderType}{draft.limitPrice !== null ? ` @ ${draft.limitPrice}` : ""}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">TIF</dt><dd>{draft.tif}</dd></div>
            </dl>
          ) : null}

          {reply ? (
            <div className="space-y-1 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2">
              <p className="text-xs font-medium text-destructive">IBKR needs you to acknowledge:</p>
              {reply.messages.map((message) => (
                <p key={message} className="text-[11px] leading-relaxed text-muted-foreground">
                  {message}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              This sends a real order to Interactive Brokers through your local gateway. IBKR may return
              risk warnings that need a further confirmation.
            </p>
          )}

          {error ? <IbkrErrorNotice error={error} /> : null}

          <div className="flex items-center gap-2">
            <Button
              className="flex-1"
              disabled={busy}
              onClick={() => {
                if (reply) confirmMutation.mutate(reply.id);
                else if (draft) submitMutation.mutate(draft);
              }}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {reply ? "Acknowledge & place order" : "Place order"}
            </Button>
            <Button
              variant="ghost"
              disabled={busy}
              onClick={() => {
                setDraft(null);
                setReply(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
