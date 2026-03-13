import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { fetchCurrentSession } from "@gridix/utils";
import { supabase, supabaseAuthInitPromise } from "@gridix/utils/api";

export interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  company_name: string | null;
  phone: string | null;
  preferred_locale?: string | undefined;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  requiresPasswordSetup: boolean;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

const QUERY_TIMEOUT = 5000;

function createFallbackProfile(userId: string, currentUser: User): UserProfile {
  return {
    id: userId,
    email: currentUser.email ?? null,
    full_name:
      typeof currentUser.user_metadata?.full_name === "string"
        ? currentUser.user_metadata.full_name
        : null,
    avatar_url: null,
    company_name:
      typeof currentUser.user_metadata?.company_name === "string"
        ? currentUser.user_metadata.company_name
        : null,
    phone:
      typeof currentUser.user_metadata?.phone === "string"
        ? currentUser.user_metadata.phone
        : null,
    preferred_locale: undefined,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [requiresPasswordSetup, setRequiresPasswordSetup] = useState(false);

  const currentUserIdRef = useRef<string | null>(null);
  const loadedProfileUserIdRef = useRef<string | null>(null);
  const loadingProfileRef = useRef<Set<string>>(new Set());

  const applyUserProfile = useCallback((profile: UserProfile | null) => {
    loadedProfileUserIdRef.current = profile?.id ?? null;
    setUserProfile(profile);
  }, []);

  const loadUserProfile = useCallback(
    async (userId: string, currentUser: User, signal: AbortSignal) => {
      if (
        signal.aborted ||
        currentUserIdRef.current !== userId ||
        loadingProfileRef.current.has(userId)
      ) {
        return;
      }

      if (loadedProfileUserIdRef.current === userId) {
        setLoading(false);
        return;
      }

      loadingProfileRef.current.add(userId);
      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      try {
        const queryPromise = supabase
          .from("user_profiles")
          .select("*")
          .eq("id", userId)
          .single();

        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(
            () => reject(new Error("Query timeout")),
            QUERY_TIMEOUT,
          );
        });

        const { data, error } = await Promise.race([
          queryPromise as unknown as Promise<{
            data: UserProfile | null;
            error: unknown;
          }>,
          timeoutPromise,
        ]);

        if (signal.aborted || currentUserIdRef.current !== userId) {
          return;
        }

        if (error) {
          applyUserProfile(createFallbackProfile(userId, currentUser));
          return;
        }

        applyUserProfile(data ?? createFallbackProfile(userId, currentUser));
      } catch (error) {
        if (!signal.aborted && currentUserIdRef.current === userId) {
          console.error("Error loading user profile:", error);
          applyUserProfile(createFallbackProfile(userId, currentUser));
        }
      } finally {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        loadingProfileRef.current.delete(userId);
        if (!signal.aborted && currentUserIdRef.current === userId) {
          setLoading(false);
        }
      }
    },
    [applyUserProfile],
  );

  useEffect(() => {
    const abortController = new AbortController();

    const initializeAuth = async () => {
      try {
        await supabaseAuthInitPromise;
        const { session } = await fetchCurrentSession();
        if (abortController.signal.aborted) return;

        setSession(session);
        setUser(session?.user ?? null);

        if (!session?.user) {
          currentUserIdRef.current = null;
          setLoading(false);
          return;
        }

        currentUserIdRef.current = session.user.id;
        setRequiresPasswordSetup(
          session.user.user_metadata?.requires_password_setup === true,
        );
        await loadUserProfile(
          session.user.id,
          session.user,
          abortController.signal,
        );
      } catch (error) {
        if (!abortController.signal.aborted) {
          console.error("Error initializing auth:", error);
          setLoading(false);
        }
      }
    };

    void initializeAuth();

    const { data: subscriptionData } = supabase.auth.onAuthStateChange(
      async (_event, nextSession) => {
        if (abortController.signal.aborted) return;

        const nextUser = nextSession?.user ?? null;
        currentUserIdRef.current = nextUser?.id ?? null;

        setSession(nextSession);
        setUser(nextUser);
        setRequiresPasswordSetup(
          nextUser?.user_metadata?.requires_password_setup === true,
        );

        if (!nextUser) {
          applyUserProfile(null);
          loadingProfileRef.current.clear();
          setLoading(false);
          return;
        }

        loadedProfileUserIdRef.current = null;
        await loadUserProfile(nextUser.id, nextUser, abortController.signal);
      },
    );

    return () => {
      abortController.abort();
      subscriptionData.subscription.unsubscribe();
    };
  }, [applyUserProfile, loadUserProfile]);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  const updateProfile = useCallback(
    async (profileData: Partial<UserProfile>) => {
      if (!user) throw new Error("No user logged in");
      if (!Object.keys(profileData).length) {
        throw new Error("No profile data provided");
      }

      const sanitizedProfileData = Object.fromEntries(
        Object.entries(profileData).filter(([, value]) => value !== undefined),
      ) as Record<string, unknown>;

      const { data, error } = await supabase
        .from("user_profiles")
        .update({
          ...sanitizedProfileData,
          updated_at: new Date().toISOString(),
        } as Record<string, unknown>)
        .eq("id", user.id)
        .select()
        .single();

      if (error) throw error;
      applyUserProfile(data);
    },
    [applyUserProfile, user],
  );

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      userProfile,
      session,
      loading,
      requiresPasswordSetup,
      signOut,
      updateProfile,
    }),
    [
      loading,
      requiresPasswordSetup,
      session,
      signOut,
      updateProfile,
      user,
      userProfile,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
