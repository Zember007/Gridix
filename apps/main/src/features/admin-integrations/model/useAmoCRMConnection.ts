import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/shared/api/supabase";
import { useLanguage, useLanguageNavigation } from "@gridix/utils/react";
import { trackOnboardingMilestone } from "@gridix/utils/integrations";

export interface CRMConnection {
  id: string;
  user_id: string;
  crm_type: string;
  subdomain: string;
  access_token?: string | null;
  refresh_token?: string | null;
  token_expires_at?: string | null;
  account_name?: string | null;
}

export const useAmoCRMConnection = () => {
  const { t } = useLanguage();
  const { getPathWithLanguage } = useLanguageNavigation();
  const [connection, setConnection] = useState<CRMConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [authorizing, setAuthorizing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
  const [showProjectsModal, setShowProjectsModal] = useState(false);

  const isAuthorized = connection?.access_token && connection?.refresh_token;
  const tokenExpired =
    connection?.token_expires_at && !connection.refresh_token
      ? new Date(connection.token_expires_at) < new Date()
      : false;
  const isConnected = !!(isAuthorized && !tokenExpired);

  const fetchConnection = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke("amocrm-api", {
        body: { action: "get_connection" },
      });

      if (error) throw error;
      setConnection(data.connection);
    } catch (error) {
      console.error("Error fetching AmoCRM connection:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConnection();
    const params = new URLSearchParams(window.location.search);
    if (params.get("crm") === "amocrm" && params.get("auth") === "success") {
      toast.success(t("admin.common.active"));
      window.history.replaceState({}, document.title, window.location.pathname);
      fetchConnection();
    }
  }, [fetchConnection, t]);

  useEffect(() => {
    if (!isConnected) return;
    void trackOnboardingMilestone({
      eventName: "gridix_crm_connected",
      properties: { crm: "amocrm" },
      onceKey: "gridix_crm_connected",
    });
  }, [isConnected]);

  const handleAuth = async () => {
    try {
      setAuthorizing(true);
      const { data, error } = await supabase.functions.invoke(
        "amocrm-start-auth",
        {
          body: {
            return_to: `${getPathWithLanguage("/admin")}?page=integrations&crm=amocrm&auth=success`,
          },
        },
      );

      if (error) throw error;
      if (data?.auth_url) {
        window.open(data.auth_url, "_self");
      } else {
        throw new Error("No auth URL received");
      }
    } catch (error) {
      console.error("Auth error:", error);
      toast.error(t("amocrm.authError"));
    } finally {
      setAuthorizing(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setDisconnecting(true);
      const { error } = await supabase.functions.invoke("amocrm-api", {
        body: {
          action: "disconnect_user_connection",
        },
      });

      if (error) {
        const { error: deleteError } = await supabase
          .from("crm_connections")
          .delete()
          .eq("crm_type", "amocrm")
          .eq("id", connection?.id || "");

        if (deleteError) throw deleteError;
      }

      setConnection(null);
      setShowDisconnectDialog(false);
      toast.success(t("amocrm.disconnectSuccess"));
    } catch (error) {
      console.error("Error disconnecting AmoCRM:", error);
      toast.error(t("amocrm.disconnectError"));
    } finally {
      setDisconnecting(false);
    }
  };

  return {
    t,
    connection,
    loading,
    authorizing,
    disconnecting,
    showDisconnectDialog,
    setShowDisconnectDialog,
    showProjectsModal,
    setShowProjectsModal,
    isAuthorized,
    tokenExpired,
    handleAuth,
    handleDisconnect,
  };
};
