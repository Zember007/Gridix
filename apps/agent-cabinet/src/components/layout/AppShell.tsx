import type { ReactNode } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Button } from "@gridix/ui";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

export function AppShell({ children }: { children: ReactNode }) {
  const { t, language } = useLanguage();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link to={`/${language}/`} className="font-black text-slate-900">
            {t("common.app.title")}
          </Link>

          <nav className="flex items-center gap-2 text-sm">
            <NavLink
              to={`/${language}/`}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-md font-bold ${
                  isActive ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
                }`
              }
              end
            >
              {t("common.nav.projects")}
            </NavLink>
            <NavLink
              to={`/${language}/projects`}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-md font-bold ${
                  isActive ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
                }`
              }
            >
              {t("common.nav.projects")}
            </NavLink>
            <NavLink
              to={`/${language}/contacts`}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-md font-bold ${
                  isActive ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
                }`
              }
            >
              {t("common.nav.contacts")}
            </NavLink>
          </nav>

          <div className="flex items-center gap-2">
            {user?.email ? (
              <div className="hidden sm:block text-xs text-slate-500 max-w-[220px] truncate">
                {user.email}
              </div>
            ) : null}
            <Button
              variant="outline"
              onClick={async () => {
                await signOut();
                navigate(`/${language}/auth`, { replace: true });
              }}
            >
              {t("common.auth.signOut")}
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}

