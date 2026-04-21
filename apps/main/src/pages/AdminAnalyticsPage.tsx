import { useEffect } from "react";
import { AdminAnalytics } from "@/features/admin-analytics";
import { ADMIN_THEME, getAdminThemeVariables } from "@gridix/utils/lib";

const AdminAnalyticsPage = () => {
  useEffect(() => {
    const themeVariables = getAdminThemeVariables(ADMIN_THEME);
    Object.entries(themeVariables).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-[1400px] px-3 py-3 sm:px-6 sm:py-4 lg:py-6">
        <AdminAnalytics />
      </div>
    </div>
  );
};

export default AdminAnalyticsPage;
