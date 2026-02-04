import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { getLanguageFromPath } from "@gridix/utils/lib";

export default function AuthRedirectPage() {
  const location = useLocation();

  useEffect(() => {
    const ssoBase = (import.meta as any).env?.VITE_SSO_URL as string | undefined;
    if (!ssoBase) return;
    const base = ssoBase.endsWith("/") ? ssoBase.slice(0, -1) : ssoBase;
    const lang = getLanguageFromPath(location.pathname) || "en";
    const urlParams = new URLSearchParams(location.search);
    const explicitRedirect = urlParams.get("redirect");
    const redirectTo =
      explicitRedirect && explicitRedirect.startsWith("/")
        ? `${window.location.origin}${explicitRedirect}`
        : null;

    // Preserve whether user opened /auth/signup or /auth/signin
    const clean = location.pathname.replace(/^\/(ru|en|ka|ar|he)\//, "/");
    const targetPath =
      clean.startsWith("/auth/signup") ? "auth/signup" : clean.startsWith("/auth/signin") ? "auth/signin" : "auth";

    const qs = new URLSearchParams();
    if (redirectTo) qs.set("redirect_to", redirectTo);
    // preserve ref/invite/utm params for signup funnels
    for (const [k, v] of urlParams.entries()) {
      if (k === "redirect") continue;
      if (!qs.has(k)) qs.set(k, v);
    }

    const tail = qs.toString();
    window.location.replace(`${base}/${lang}/${targetPath}${tail ? `?${tail}` : ""}`);
  }, [location.pathname, location.search]);

  return null;
}

