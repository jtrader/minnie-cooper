import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ExternalLink, Loader2, ShieldCheck, Trash2, Network } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  removeIbkrSettings,
  saveIbkrSettings,
  type IbkrSettings,
} from "@/lib/ibkr/settings.functions";
import { DEFAULT_GATEWAY_URL, gatewayOrigin } from "@/lib/ibkr/gateway";

type ConnectIbkrModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings?: IbkrSettings | undefined;
};

export function ConnectIbkrModal({ open, onOpenChange, settings }: ConnectIbkrModalProps) {
  const [baseUrl, setBaseUrl] = useState(DEFAULT_GATEWAY_URL);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const save = useServerFn(saveIbkrSettings);
  const remove = useServerFn(removeIbkrSettings);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setBaseUrl(settings?.gatewayBaseUrl ?? DEFAULT_GATEWAY_URL);
  }, [open, settings?.gatewayBaseUrl]);

  const saveMutation = useMutation({
    mutationFn: () =>
      save({ data: { gatewayBaseUrl: baseUrl, defaultAccountId: settings?.defaultAccountId ?? null } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["ibkr-settings"] });
      onOpenChange(false);
    },
    onError: (err: unknown) => setError(err instanceof Error ? err.message : "Could not save the gateway URL."),
  });

  const removeMutation = useMutation({
    mutationFn: () => remove({ data: undefined }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["ibkr-settings"] });
      onOpenChange(false);
    },
    onError: (err: unknown) => setError(err instanceof Error ? err.message : "Could not disconnect."),
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
            <Network className="h-4 w-4 text-primary" />
            {settings?.configured ? "Update Interactive Brokers gateway" : "Connect Interactive Brokers"}
          </DialogTitle>
        </DialogHeader>

        <form className="space-y-3" onSubmit={submit}>
          <div className="space-y-1.5">
            <Label htmlFor="ibkr-base-url" className="text-xs">Client Portal Gateway base URL</Label>
            <Input
              id="ibkr-base-url"
              required
              autoComplete="off"
              spellCheck={false}
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder={DEFAULT_GATEWAY_URL}
              className="font-mono text-xs"
            />
            <p className="text-[11px] text-muted-foreground">
              Usually <span className="font-mono text-foreground">{DEFAULT_GATEWAY_URL}</span>. This is
              stored as a preference only — no credentials are collected or kept.
            </p>
          </div>

          <div className="space-y-2 rounded-md border border-border bg-muted/30 px-3 py-2">
            <p className="text-[11px] font-medium text-foreground">Before this works, you need to:</p>
            <ol className="list-decimal space-y-1 pl-4 text-[11px] leading-relaxed text-muted-foreground">
              <li>Run IBKR&apos;s Client Portal Gateway locally (the Java <span className="font-mono">bin/run.sh</span> package).</li>
              <li>
                Open{" "}
                <a
                  href={gatewayOrigin(baseUrl || DEFAULT_GATEWAY_URL)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-mono text-primary underline underline-offset-2"
                >
                  {gatewayOrigin(baseUrl || DEFAULT_GATEWAY_URL)} <ExternalLink className="h-3 w-3" />
                </a>{" "}
                once in this browser and accept its self-signed certificate.
              </li>
            <li>
                Log in with your IBKR username, password and 2FA <strong>on the gateway&apos;s own page</strong> —
                never here.
              </li>
            </ol>
            <p className="mt-2 border-t border-border pt-2 text-[11px] leading-relaxed text-muted-foreground">
              Optional: avoid the daily gateway login by running{" "}
              <a
                href="https://github.com/IbcAlpha/IBC"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-medium text-primary underline underline-offset-2"
              >
                IBC <ExternalLink className="h-3 w-3" />
              </a>{" "}
              locally. It handles auto-login on your own machine — we never see or store those credentials.
            </p>
          </div>

          <div className="flex items-start gap-2 rounded-md border border-border bg-card px-3 py-2">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              This dashboard never sees your IBKR credentials. Your browser talks straight to the
              gateway on your machine using the session it already holds, and we keep that session
              warm while this page is open.
            </p>
          </div>

          {error ? <p className="text-xs text-destructive">{error}</p> : null}

          <div className="flex items-center gap-2">
            <Button type="submit" className="flex-1" disabled={busy}>
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {settings?.configured ? "Update gateway URL" : "Connect Interactive Brokers"}
            </Button>
            {settings?.configured ? (
              <Button type="button" variant="outline" disabled={busy} onClick={() => removeMutation.mutate()}>
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
