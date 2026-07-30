import { useEffect, useState, type ReactNode } from "react";
import { LogIn, ShieldX, Loader2 } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { OptimalLogo } from "@/components/kraken/optimal-logo";

const ALLOWED_EMAIL = "support@lovekey.com.au";

type GateState = "checking" | "signed-out" | "denied" | "allowed";

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-8 text-center">
        <div className="mb-6 flex justify-center">
          <OptimalLogo />
        </div>
        {children}
      </div>
    </div>
  );
}

export function AuthGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GateState>("checking");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;

    const evaluate = async (session: Session | null) => {
      if (!session) {
        if (active) setState("signed-out");
        return;
      }
      const { data, error: userError } = await supabase.auth.getUser();
      const email = data.user?.email?.toLowerCase() ?? null;
      if (userError || !email) {
        if (active) setState("signed-out");
        return;
      }
      if (email !== ALLOWED_EMAIL) {
        await supabase.auth.signOut();
        if (active) setState("denied");
        return;
      }
      if (active) setState("allowed");
    };

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        setState((prev) => (prev === "denied" ? prev : "signed-out"));
        return;
      }
      void evaluate(session);
    });

    void supabase.auth.getSession().then(({ data }) => evaluate(data.session));

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (state === "allowed") return <>{children}</>;

  if (state === "checking") {
    return (
      <Shell>
        <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
        <p className="mt-3 text-sm text-muted-foreground">Checking your session…</p>
      </Shell>
    );
  }

  if (state === "denied") {
    return (
      <Shell>
        <ShieldX className="mx-auto h-8 w-8 text-destructive" />
        <h1 className="mt-4 text-lg font-semibold text-foreground">Access denied</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This app is restricted to a single account. You've been signed out.
        </p>
        <Button className="mt-6 w-full" variant="outline" onClick={() => setState("signed-out")}>
          Back to sign in
        </Button>
      </Shell>
    );
  }

  return (
    <Shell>
      <h1 className="text-lg font-semibold text-foreground">Sign in</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        This dashboard is private. Sign in with the authorised Google account to continue.
      </p>
      <Button
        className="mt-6 w-full"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError(null);
          const result = await lovable.auth.signInWithOAuth("google", {
            redirect_uri: window.location.origin,
          });
          if ("error" in result && result.error) {
            setError(result.error.message ?? "Sign-in failed.");
            setBusy(false);
            return;
          }
          if ("redirected" in result && result.redirected) return;
          setBusy(false);
        }}
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
        Sign in with Google
      </Button>
      {error ? <p className="mt-3 text-xs text-destructive">{error}</p> : null}
    </Shell>
  );
}
