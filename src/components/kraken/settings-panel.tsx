import { useState } from "react";
import { Check, CheckCircle2, Copy, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BridgeErrorNotice } from "./bridge-error-notice";
import { checkHealth } from "@/lib/kraken/client";
import { DEFAULT_BASE_URL } from "@/lib/kraken/settings";
import type { BridgeSettings } from "@/lib/kraken/types";

function randomToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      aria-label={label}
      className="shrink-0 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1500);
        } catch {
          setCopied(false);
        }
      }}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

type SettingsPanelProps = {
  settings: BridgeSettings;
  onSave: (next: BridgeSettings) => void;
  onDone?: () => void;
};

export function SettingsPanel({ settings, onSave, onDone }: SettingsPanelProps) {
  const [baseUrl, setBaseUrl] = useState(settings.baseUrl || DEFAULT_BASE_URL);
  const [token, setToken] = useState(settings.token);
  const [testing, setTesting] = useState(false);
  const [health, setHealth] = useState<string | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [generated, setGenerated] = useState<string | null>(null);

  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const launchCommand = generated
    ? [
        `KRAKEN_BRIDGE_TOKEN=${generated} \\`,
        `KRAKEN_BRIDGE_ALLOWED_ORIGIN=${origin} \\`,
        `  npm run kraken-bridge`,
      ].join("\n")
    : "";

  const runTest = async () => {
    setTesting(true);
    setError(null);
    setHealth(null);
    try {
      const status = await checkHealth({ baseUrl, token });
      setHealth(status);
    } catch (err) {
      setError(err);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="baseUrl" className="text-xs uppercase tracking-wide text-muted-foreground">
          Bridge base URL
        </Label>
        <Input
          id="baseUrl"
          value={baseUrl}
          onChange={(event) => setBaseUrl(event.target.value)}
          placeholder={DEFAULT_BASE_URL}
          className="font-mono text-sm"
          autoComplete="off"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="token" className="text-xs uppercase tracking-wide text-muted-foreground">
          Bearer token
        </Label>
        <div className="flex gap-2">
          <Input
            id="token"
            type={generated ? "text" : "password"}
            value={token}
            onChange={(event) => setToken(event.target.value)}
            placeholder="paste kraken-bridge token"
            className="font-mono text-sm"
            autoComplete="off"
          />
          <Button
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={() => {
              const next = randomToken();
              setToken(next);
              setGenerated(next);
              setHealth(null);
              setError(null);
            }}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Generate
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Stored in this browser&apos;s localStorage only, and sent only to the bridge URL above.
        </p>
      </div>

      {generated ? (
        <div className="space-y-2 rounded-md border border-border bg-muted/40 p-3">
          <p className="text-[11px] text-muted-foreground">
            New token generated in this browser. Save it here, then start the bridge with the exact
            command below so both sides share the same token.
          </p>
          <div className="flex items-start gap-2">
            <pre className="min-w-0 flex-1 overflow-x-auto whitespace-pre font-mono text-[11px] leading-relaxed text-foreground">
              {launchCommand}
            </pre>
            <CopyButton value={launchCommand} label="Copy bridge launch command" />
          </div>
        </div>
      ) : null}

      {error ? <BridgeErrorNotice error={error} /> : null}
      {health ? (
        <div className="flex items-center gap-2 rounded-md border border-gain/40 bg-gain/10 px-3 py-2 text-xs text-gain">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span className="font-mono">/healthz status: {health}</span>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={runTest} disabled={testing || !baseUrl}>
          {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          Test connection
        </Button>
        <Button
          size="sm"
          disabled={!baseUrl.trim() || !token.trim()}
          onClick={() => {
            onSave({ baseUrl: baseUrl.trim(), token: token.trim() });
            onDone?.();
          }}
        >
          Save and continue
        </Button>
      </div>
    </div>
  );
}