import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase, supabaseAuthInitPromise } from "@gridix/utils/api";
const AuthContext = createContext(undefined);
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        await supabaseAuthInitPromise;
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;
        setSession(data.session ?? null);
        setUser(data.session?.user ?? null);
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
  const value = useMemo(
    () => ({
      user,
      session,
      loading,
      signInWithOtp: async (email) => {
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
  return _jsx(AuthContext.Provider, { value: value, children: children });
}
