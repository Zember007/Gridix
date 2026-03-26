import { Eye } from "@phosphor-icons/react";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * Shown at the top of the dashboard when the active workspace is the demo
 * developer account and the current user is a read-only demo viewer.
 */
export const DemoBanner = () => {
  const { t } = useLanguage();

  return (
    <div className="flex items-start gap-3 border-b border-amber-200 bg-amber-50 px-6 py-3 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
      <Eye className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-semibold">
          {t("admin.demo.bannerTitle")}
        </span>
        <span className="text-xs opacity-80">
          {t("admin.demo.bannerDescription")}
        </span>
      </div>
    </div>
  );
};
