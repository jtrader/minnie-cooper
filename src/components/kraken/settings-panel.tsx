import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BridgeErrorNotice } from "./bridge-error-notice";
import { checkHealth } from "@/lib/kraken/client";
import { DEFAULT_BASE_URL } from "@/lib/kraken/settings";
import type { BridgeSettings } from "@/lib/kraken/types";

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
        <Input
          id="token"
          type="password"
          value={token}
          onChange={(event) => setToken(event.target.value)}
          placeholder="paste kraken-bridge token"
          className="font-mono text-sm"
          autoComplete="off"
        />
        <p className="text-[11px] text-muted-foreground">
          Stored in this browser&apos;s localStorage only, and sent only to the bridge URL above.
        </p>
      </div>

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