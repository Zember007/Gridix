import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase, supabaseAuthInitPromise } from "@gridix/utils/api";
import { fetchCurrentSession } from "@gridix/utils";
import { AuthContext, type AuthContextValue } from "@/shared/lib/auth";

interface Props {
  children: ReactNode;
}

export function AuthProvider({ children }: Props) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        await supabaseAuthInitPromise;
        const sessionData = await fetchCurrentSession();
        if (!mounted) return;
        setSession(sessionData.session ?? null);
        setUser(sessionData.session?.user ?? null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void init();

    const { data: sub } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        if (!mounted) return;
        setSession(nextSession);
        setUser(nextSession?.user ?? null);
        setLoading(false);
      },
    );

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      loading,
      signInWithOtp: async (email: string) => {
        const cleaned = email.trim();
        if (!cleaned) throw new Error("Email is required");
        const { error } = await supabase.auth.signInWithOtp({ email: cleaned });
        if (error) throw error;
      },
      signOut: async () => {
        await supabase.auth.signOut();
      },
    }),
    [session, user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
