import { useEffect } from "react";
import { AdminAnalytics } from "@/components/admin/AdminAnalytics";
import { ADMIN_THEME, getAdminThemeVariables } from "@/lib/admin-theme-config";

const AdminAnalyticsPage = () => {
  useEffect(() => {
    const themeVariables = getAdminThemeVariables(ADMIN_THEME);
    Object.entries(themeVariables).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6 lg:py-10">
        <AdminAnalytics />
      </div>
    </div>
  );
};

export default AdminAnalyticsPage;

