import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ExternalLink, KeyRound, Loader2, ShieldCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { saveMt5Credentials, removeMt5Credentials, type Mt5CredentialStatus } from "@/lib/mt5/credentials.functions";
import { MT5_REGIONS, type Mt5Region } from "@/lib/mt5/types";

type Props = { open: boolean; onOpenChange: (open: boolean) => void; status?: Mt5CredentialStatus; onSaved?: () => void };

export function ConnectMt5Modal({ open, onOpenChange, status, onSaved }: Props) {
  const [brokerServer, setBrokerServer] = useState("");
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [region, setRegion] = useState<Mt5Region>("new-york");
  const [tradingEnabled, setTradingEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const save = useServerFn(saveMt5Credentials);
  const remove = useServerFn(removeMt5Credentials);

  useEffect(() => {
    if (!open) return;
    setBrokerServer(status?.brokerServer ?? "");
    setLogin("");
    setPassword("");
    setRegion(status?.region ?? "new-york");
    setTradingEnabled(status?.tradingEnabled ?? false);
    setError(null);
  }, [open, status?.brokerServer, status?.region, status?.tradingEnabled]);

  const saveMutation = useMutation({
    mutationFn: () => save({ data: { brokerServer, login, password, region, tradingEnabled } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["mt5-credentials"] });
      onSaved?.();
      onOpenChange(false);
    },
    onError: (err: unknown) => setError(err instanceof Error ? err.message : "Could not save MetaTrader 5 credentials."),
  });
  const removeMutation = useMutation({
    mutationFn: () => remove({ data: undefined }),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["mt5-credentials"] }); onOpenChange(false); },
    onError: (err: unknown) => setError(err instanceof Error ? err.message : "Could not remove MetaTrader 5 credentials."),
  });
  const busy = saveMutation.isPending || removeMutation.isPending;
  const submit = (event: FormEvent) => { event.preventDefault(); setError(null); saveMutation.mutate(); };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="flex items-center gap-2 text-base"><KeyRound className="h-4 w-4 text-primary" />{status?.connected ? "Update MetaTrader 5 connection" : "Connect MetaTrader 5"}</DialogTitle></DialogHeader>
        {status?.connected ? <p className="rounded-md border border-border bg-muted/30 px-3 py-2 font-mono text-[11px] text-muted-foreground">Connected · account ····{status.loginMasked?.slice(-4) ?? "????"}</p> : null}
        <form className="space-y-3" onSubmit={submit}>
          <div className="space-y-1.5"><Label htmlFor="mt5-server" className="text-xs">Broker / MT5 server</Label><Input id="mt5-server" required autoComplete="off" value={brokerServer} onChange={e => setBrokerServer(e.target.value)} placeholder="Broker-MT5Live" className="font-mono text-xs" /></div>
          <div className="space-y-1.5"><Label htmlFor="mt5-login" className="text-xs">MT5 account number</Label><Input id="mt5-login" required inputMode="numeric" autoComplete="off" value={login} onChange={e => setLogin(e.target.value)} placeholder="12345678" className="font-mono text-xs" /></div>
          <div className="space-y-1.5"><Label htmlFor="mt5-password" className="text-xs">MT5 password</Label><Input id="mt5-password" type="password" required autoComplete="off" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••••••" className="font-mono text-xs" /></div>
          <div className="space-y-1.5"><Label htmlFor="mt5-region" className="text-xs">MetaApi region</Label><select id="mt5-region" value={region} onChange={e => setRegion(e.target.value as Mt5Region)} className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs">{MT5_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
          <div className="flex items-start justify-between gap-3 rounded-md border border-border bg-card px-3 py-2"><div><p className="text-xs font-medium">Trading permissions</p><p className="mt-0.5 text-[11px] text-muted-foreground">Leave off unless you intentionally want this connection to be used for order placement. Use trading-enabled MT5 credentials only when needed.</p></div><Switch checked={tradingEnabled} onCheckedChange={setTradingEnabled} /></div>
          <div className="flex items-start gap-2 rounded-md border border-border bg-muted/30 px-3 py-2"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" /><p className="text-[11px] leading-relaxed text-muted-foreground">Credentials are encrypted before storage and only handled server-side. We validate the account through MetaApi before saving; your password is never returned to the browser. MetaTrader 5 is connected through MetaApi Cloud rather than a local terminal. <a href="https://metaapi.cloud/docs/client/restApi/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary underline underline-offset-2">MetaApi REST docs <ExternalLink className="h-3 w-3" /></a></p></div>
          {error ? <p className="text-xs text-destructive">{error}</p> : null}
          <div className="flex items-center gap-2"><Button type="submit" className="flex-1" disabled={busy}>{saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}{status?.connected ? "Update credentials" : "Connect MetaTrader 5"}</Button>{status?.connected ? <Button type="button" variant="outline" disabled={busy} onClick={() => removeMutation.mutate()}><Trash2 className="h-3.5 w-3.5" /> Remove</Button> : <Button type="button" variant="ghost" disabled={busy} onClick={() => onOpenChange(false)}>Later</Button>}</div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
