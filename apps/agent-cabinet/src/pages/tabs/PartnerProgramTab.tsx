import { useState } from "react";
import { PartnerProgram } from "@gridix/partner-program";
import { IconLoader2 } from "@tabler/icons-react";
import { Eye } from "lucide-react";
import { useLanguage } from "@/shared/lib/language";
import { supabase } from "@gridix/utils/api";

const MAIN_APP_URL =
  (import.meta.env as { VITE_MAIN_APP_URL?: string }).VITE_MAIN_APP_URL ??
  "https://app.gridix.live";

function OpenMainAppButton() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const label = loading
    ? t("admin.demo.joining") || "..."
    : t("common.demoCabinetButton") || "Кабинет застройщика";

  const handleClick = async () => {
    setLoading(true);
    try {
      const [joinResult, sessionResult] = await Promise.all([
        supabase.functions.invoke("join-demo"),
        supabase.auth.getSession(),
      ]);
      const developerId = joinResult.data?.developer_id as string | undefined;
      const session = sessionResult.data.session;

      const url = new URL(MAIN_APP_URL);
      if (developerId) url.searchParams.set("demo_workspace", developerId);

      let target = url.toString();
      if (session) {
        target += `#access_token=${session.access_token}&refresh_token=${session.refresh_token}&type=magiclink`;
      }

      window.open(target, "_blank", "noopener,noreferrer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => void handleClick()}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/20 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10 disabled:opacity-50"
      >
        {loading ? (
          <IconLoader2 size={18} className="flex-shrink-0 animate-spin" />
        ) : (
          <Eye className="h-[18px] w-[18px] flex-shrink-0" />
        )}
        {label}
      </button>
    </div>
  );
}

export function PartnerProgramTab() {
  return (
    <div className="mx-auto max-w-[1600px] p-4 md:p-6">
      <PartnerProgram
        navigationMode="tabs"
        joinDemoSlot={<OpenMainAppButton />}
      />
    </div>
  );
}
