import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ExternalLink, KeyRound, Loader2, ShieldCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  saveKrakenCredentials,
  removeKrakenCredentials,
  type KrakenCredentialStatus,
} from "@/lib/kraken/credentials.functions";

type ConnectKrakenModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  status?: KrakenCredentialStatus | undefined;
  onSaved?: () => void;
};

export function ConnectKrakenModal({ open, onOpenChange, status, onSaved }: ConnectKrakenModalProps) {
  const [apiKey, setApiKey] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [tradingEnabled, setTradingEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const save = useServerFn(saveKrakenCredentials);
  const remove = useServerFn(removeKrakenCredentials);

  useEffect(() => {
    if (!open) return;
    setApiKey("");
    setPrivateKey("");
    setError(null);
    setTradingEnabled(status?.tradingEnabled ?? false);
  }, [open, status?.tradingEnabled]);

  const saveMutation = useMutation({
    mutationFn: () => save({ data: { apiKey, privateKey, tradingEnabled } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["kraken-credentials"] });
      onSaved?.();
      onOpenChange(false);
    },
    onError: (err: unknown) => setError(err instanceof Error ? err.message : "Could not save credentials."),
  });

  const removeMutation = useMutation({
    mutationFn: () => remove({ data: undefined }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["kraken-credentials"] });
      onOpenChange(false);
    },
    onError: (err: unknown) => setError(err instanceof Error ? err.message : "Could not remove credentials."),
  });

  const busy = saveMutation.isPending || removeMutation.isPending;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    saveMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <KeyRound className="h-4 w-4 text-[#4ECDC4]" />
            {status?.connected ? "Update Kraken connection" : "Connect Kraken"}
          </DialogTitle>
        </DialogHeader>

        {status?.connected ? (
          <p className="rounded-md border border-border bg-muted/30 px-3 py-2 font-mono text-[11px] text-muted-foreground">
            Connected · key ····{status.apiKeyLast4 ?? "????"}
            {status.updatedAt ? ` · updated ${new Date(status.updatedAt).toLocaleDateString()}` : ""}
          </p>
        ) : null}

        <form className="space-y-3" onSubmit={submit}>
          <div className="space-y-1.5">
            <Label htmlFor="kraken-api-key" className="text-xs">Kraken API key (public)</Label>
            <Input
              id="kraken-api-key"
              required
              autoComplete="off"
              spellCheck={false}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="font-mono text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="kraken-private-key" className="text-xs">Kraken private key (secret)</Label>
            <Input
              id="kraken-private-key"
              type="password"
              required
              autoComplete="off"
              spellCheck={false}
              value={privateKey}
              onChange={(e) => setPrivateKey(e.target.value)}
              placeholder="••••••••••••••••••••••••"
              className="font-mono text-xs"
            />
          </div>

          <div className="flex items-start justify-between gap-3 rounded-md border border-border bg-card px-3 py-2">
            <div>
              <p className="text-xs font-medium text-foreground">Trading permissions</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Leave off unless your key intentionally allows order placement.
              </p>
            </div>
            <Switch checked={tradingEnabled} onCheckedChange={setTradingEnabled} />
          </div>

          <div className="flex items-start gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#4ECDC4]" />
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Keys are encrypted before storage and only ever decrypted server-side to call Kraken on
              your behalf — they are never returned to the browser. Create a key with{" "}
              <span className="font-mono text-foreground">Query Funds</span>,{" "}
              <span className="font-mono text-foreground">Query Open/Closed Orders</span> and{" "}
              <span className="font-mono text-foreground">Query Ledger</span> only — no withdraw or
              trade permissions unless you enable trading above.{" "}
              <a
                href="https://support.kraken.com/hc/en-us/articles/360000919966-How-to-generate-an-API-key-pair"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[#4ECDC4] underline underline-offset-2"
              >
                Kraken API key docs <ExternalLink className="h-3 w-3" />
              </a>
            </p>
          </div>

          {error ? <p className="text-xs text-destructive">{error}</p> : null}

          <div className="flex items-center gap-2">
            <Button type="submit" className="flex-1" disabled={busy}>
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {status?.connected ? "Update credentials" : "Connect Kraken"}
            </Button>
            {status?.connected ? (
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => removeMutation.mutate()}
              >
                <Trash2 className="h-3.5 w-3.5" /> Remove
              </Button>
            ) : (
              <Button type="button" variant="ghost" disabled={busy} onClick={() => onOpenChange(false)}>
                Later
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}