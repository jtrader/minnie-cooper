import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AuthStatus = "checking" | "signed-out" | "signed-in";

export function useAuthSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<AuthStatus>("checking");

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setStatus(next ? "signed-in" : "signed-out");
    });

    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setStatus(data.session ? "signed-in" : "signed-out");
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  return { session, status };
}
