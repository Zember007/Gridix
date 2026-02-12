import type { Session } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

function getEnv(name: string, fallback: string): string {
  const v =
    typeof import.meta !== "undefined" &&
    import.meta.env &&
    typeof (import.meta.env as Record<string, string | undefined>)[name] ===
      "string"
    ? (import.meta.env as Record<string, string | undefined>)[name]
    : undefined;
  return (v && v.length > 0 ? v : fallback) as string;
}

export interface RedirectByAccountTypeOptions {
  redirectToUrl?: string | null;
  lang?: string;
}

/**
 * Resolves account_type from user_profiles, then redirects to main app or
 * agent cabinet with session tokens in hash. Used after magic link / OAuth
 * callback and when landing on auth app root with hash tokens.
 */
export async function redirectToAppByAccountType(
  supabase: SupabaseClient,
  session: Session,
  options: RedirectByAccountTypeOptions = {}
): Promise<void> {
  const { redirectToUrl, lang } = options;
  const userId = session.user?.id;
  if (!userId) throw new Error("No session user");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("account_type")
    .eq("id", userId)
    .maybeSingle();

  const accountType =
    typeof (profile as { account_type?: string } | null)?.account_type ===
    "string"
      ? String((profile as { account_type: string }).account_type)
      : "developer";

  const agentCabinet = getEnv("VITE_AGENT_CABINET_URL", "https://agent.gridix.live");
  const mainApp = getEnv("VITE_MAIN_APP_URL", "https://app.gridix.live");
  const partnersApp = getEnv("VITE_PARTNERS_APP_URL", "https://partner.gridix.live");

  const hash = new URLSearchParams({
    access_token: session.access_token,
    refresh_token: session.refresh_token ?? "",
    token_type: "bearer",
    type: "magiclink",
  }).toString();

  if (redirectToUrl) {
    try {
      const u = new URL(redirectToUrl);
      const allow = new Set([
        new URL(agentCabinet).origin,
        new URL(mainApp).origin,
        new URL(partnersApp).origin,
      ]);
      if (allow.has(u.origin)) {
        const isAgentTarget = u.origin === new URL(agentCabinet).origin;
        const isMainTarget = u.origin === new URL(mainApp).origin;
        const isPartnerTarget = u.origin === new URL(partnersApp).origin;
        const wrongTarget =
          (isAgentTarget && accountType !== "agent") ||
          (isMainTarget && (accountType === "agent" || accountType === "partner")) ||
          (isPartnerTarget && accountType !== "partner");
        if (!wrongTarget) {
          const base = `${u.origin}${u.pathname}${u.search}`;
          window.location.replace(`${base}#${hash}`);
          return;
        }
      }
    } catch {
      // fall through to default
    }
  }

  let targetBase: string;
  if (accountType === "agent") {
    targetBase = agentCabinet;
  } else if (accountType === "partner") {
    targetBase = partnersApp;
  } else {
    targetBase = mainApp;
  }
  const langFromUrl = lang ?? (window.location.pathname.split("/")[1] || "en");
  window.location.replace(`${targetBase}/${langFromUrl}/#${hash}`);
}
