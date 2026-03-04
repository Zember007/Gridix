import { Lock } from "lucide-react";
import { useLanguage } from "@/shared/lib/language";

export function NoActiveWorkspaceNotice() {
  const { t } = useLanguage();

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <Lock size={18} className="text-slate-400" />
      <div>
        <div className="font-bold text-slate-900">
          {t("common.workspace.noActiveTitle")}
        </div>
        <div className="text-sm text-slate-600">
          {t("common.workspace.pickInSidebar")}
        </div>
      </div>
    </div>
  );
}
