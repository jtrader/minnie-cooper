import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useAuthSession } from "@/components/auth/use-auth-session";

export function AuthGate({ children }: { children: ReactNode }) {
  const { status } = useAuthSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (status === "signed-out") {
      void navigate({ to: "/", replace: true, search: { auth: "1" } });
    }
  }, [status, navigate]);

  if (status === "signed-in") return <>{children}</>;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center">
        <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
        <p className="mt-3 font-mono text-xs text-muted-foreground">
          {status === "checking" ? "Checking your session…" : "Redirecting to sign in…"}
        </p>
      </div>
    </div>
  );
}
