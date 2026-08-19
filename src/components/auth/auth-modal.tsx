import { useState, type FormEvent } from "react";
import { Loader2, LogIn, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MinnieCooperLogo } from "@/components/brand/minnie-cooper-logo";

type Mode = "sign-in" | "sign-up";

type AuthModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultMode?: Mode;
  onAuthenticated?: () => void;
};

export function AuthModal({ open, onOpenChange, defaultMode = "sign-in", onAuthenticated }: AuthModalProps) {
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const switchMode = (value: Mode) => {
    setMode(value);
    setError(null);
    setNotice(null);
  };

  const startGoogle = async () => {
    setBusy(true);
    setError(null);
    setNotice(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
      extraParams: { prompt: mode === "sign-up" ? "consent select_account" : "select_account" },
    });
    if ("error" in result && result.error) {
      setError(result.error.message ?? "Google authentication failed.");
      setBusy(false);
      return;
    }
    if ("redirected" in result && result.redirected) return;
    setBusy(false);
    onAuthenticated?.();
  };

  const submitEmail = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);

    if (mode === "sign-up") {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      setBusy(false);
      if (signUpError) {
        setError(signUpError.message);
        return;
      }
      if (!data.session) {
        setNotice("Check your email to confirm your account, then sign in.");
        return;
      }
      onAuthenticated?.();
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }
    onAuthenticated?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader className="items-center">
          <MinnieCooperLogo variant="compact" />
          <DialogTitle className="pt-2 text-base">
            {mode === "sign-in" ? "Sign in to Minnie Cooper" : "Create your account"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-1 rounded-md border border-border bg-muted/40 p-1">
          {(["sign-in", "sign-up"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => switchMode(value)}
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

        <form className="space-y-3" onSubmit={submitEmail}>
          <div className="space-y-1.5">
            <Label htmlFor="auth-email" className="text-xs">Email</Label>
            <Input
              id="auth-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="font-mono text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="auth-password" className="text-xs">Password</Label>
            <Input
              id="auth-password"
              type="password"
              autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="font-mono text-sm"
            />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === "sign-in" ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
            {mode === "sign-in" ? "Sign in" : "Create account"}
          </Button>
        </form>

        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-border" />
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">or</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <Button variant="outline" className="w-full" disabled={busy} onClick={() => void startGoogle()}>
          Continue with Google
        </Button>

        {error ? <p className="text-xs text-destructive">{error}</p> : null}
        {notice ? <p className="text-xs text-muted-foreground">{notice}</p> : null}
      </DialogContent>
    </Dialog>
  );
}
