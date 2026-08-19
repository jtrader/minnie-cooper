import { useEffect, useState, type ReactNode } from "react";
import { LogIn, ShieldX, Loader2, UserPlus } from "lucide-react";
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
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");

  const startGoogle = async (intent: "sign-in" | "sign-up") => {
    setBusy(true);
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
      extraParams: { prompt: intent === "sign-up" ? "consent select_account" : "select_account" },
    });
    if ("error" in result && result.error) {
      setError(result.error.message ?? "Google authentication failed.");
      setBusy(false);
      return;
    }
    if ("redirected" in result && result.redirected) return;
    setBusy(false);
  };

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
          Your Google account isn't approved for this dashboard, so you've been signed out.
          Access is granted to approved accounts only — contact {ALLOWED_EMAIL} to request access.
        </p>
        <Button className="mt-6 w-full" variant="outline" onClick={() => setState("signed-out")}>
          Back
        </Button>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="mb-6 grid grid-cols-2 gap-1 rounded-md border border-border bg-muted/40 p-1">
        {(["sign-in", "sign-up"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setMode(value);
              setError(null);
            }}
            className={`rounded-sm px-3 py-1.5 text-xs font-medium transition-colors ${
              mode === value
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {value === "sign-in" ? "Sign in" : "Sign up"}
          </button>
        ))}
      </div>
      <h1 className="text-lg font-semibold text-foreground">
        {mode === "sign-in" ? "Sign in" : "Create your account"}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {mode === "sign-in"
          ? "This dashboard is private. Sign in with the authorised Google account to continue."
          : "Sign up with Google to create your account. Access is limited to approved accounts — if yours isn't approved yet, you'll be signed out and can request access."}
      </p>
      <Button className="mt-6 w-full" disabled={busy} onClick={() => void startGoogle(mode)}>
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : mode === "sign-in" ? (
          <LogIn className="h-4 w-4" />
        ) : (
          <UserPlus className="h-4 w-4" />
        )}
        {mode === "sign-in" ? "Sign in with Google" : "Sign up with Google"}
      </Button>
      {error ? <p className="mt-3 text-xs text-destructive">{error}</p> : null}
    </Shell>
  );
}
