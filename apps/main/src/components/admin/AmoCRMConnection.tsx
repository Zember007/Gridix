import { useState, useEffect, useCallback } from "react";
import { AmoCRMProjectList } from "@/components/admin/integrations/AmoCRMProjectList";
import { Button } from "@gridix/ui";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@gridix/ui";
import { Badge } from "@gridix/ui";
import { Alert, AlertDescription } from "@gridix/ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@gridix/ui";
import {
  ExternalLink,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Settings,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@gridix/utils/api";
import { useLanguage, useLanguageNavigation } from "@gridix/utils/react";
import { trackUsertourEvent } from "@gridix/utils/integrations";

interface CRMConnection {
  id: string;
  user_id: string;
  crm_type: string;
  subdomain: string;
  access_token?: string | null;
  refresh_token?: string | null;
  token_expires_at?: string | null;
  account_name?: string | null;
}

export const AmoCRMConnection = () => {
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
      // toast.error(t('amocrm.settingsLoadError')); // Optionally suppress error on load if not critical
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConnection();
    // Check for success param in URL (after auth redirect)
    const params = new URLSearchParams(window.location.search);
    if (params.get("crm") === "amocrm" && params.get("auth") === "success") {
      toast.success(t("admin.common.active")); // Or some success message
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
      fetchConnection();
    }
  }, [fetchConnection, t]);

  useEffect(() => {
    if (!isConnected) return;
    void trackUsertourEvent({
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
            // Admin-panel global auth (not tied to a specific project)
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
      // We'll use a direct delete or a special action if needed
      // Assuming we can delete from crm_connections directly or via edge function

      // Using edge function is safer if it handles cleanup
      const { error } = await supabase.functions.invoke("amocrm-api", {
        body: {
          action: "disconnect_user_connection",
        },
      });

      /* 
               Fallback if 'disconnect_user_connection' isn't implemented yet in the function:
               We can try to delete row directly if RLS allows.
            */
      if (error) {
        // Try direct delete
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

  if (loading) {
    return (
      <div className="flex h-full animate-pulse items-center justify-center rounded-xl bg-muted/50" />
    );
  }

  return (
    <>
      <Card className="overflow-hidden border-none shadow-md transition-all duration-300 hover:shadow-lg">
        <div className="h-2 w-full bg-[#4c8bf7]" />
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle className="flex items-center gap-2 text-xl">
              <div className="overflow-hidden rounded-lg">
                <img
                  src="/images/amoLogo.jpeg"
                  alt="AmoCRM"
                  className="h-16 w-16 object-contain"
                />
              </div>
            </CardTitle>
            {isAuthorized && !tokenExpired && (
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-700 hover:bg-green-200"
              >
                {t("admin.common.active")}
              </Badge>
            )}
            {(!isAuthorized || tokenExpired) && (
              <Badge variant="outline" className="text-muted-foreground">
                {t("admin.common.inactive")}
              </Badge>
            )}
          </div>
          <CardDescription className="mt-2">
            {t("amocrm.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isAuthorized && !tokenExpired ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-lg border border-green-100 bg-green-50/50 p-3">
                <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-green-900">
                    {t("amocrm.connectedTo")}{" "}
                    <span className="font-bold">
                      {connection?.account_name || connection?.subdomain}
                    </span>
                  </p>
                  <p className="break-all text-xs text-green-700">
                    {connection?.subdomain}.amocrm.ru
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  className="w-full border-red-200 hover:bg-red-50 hover:text-red-700"
                  onClick={() => setShowDisconnectDialog(true)}
                >
                  {t("amocrm.disconnect")}
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleAuth}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {t("amocrm.reconnect")}
                </Button>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowProjectsModal(true)}
              >
                <Settings className="mr-2 h-4 w-4" />
                {t("admin.configureProjects")}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {tokenExpired && (
                <Alert variant="destructive" className="py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {t("admin.amocrm.tokenExpired")}
                  </AlertDescription>
                </Alert>
              )}
              <Button
                className="w-full bg-[#4c8bf7] text-white shadow-lg shadow-blue-200 hover:bg-[#3b72d1]"
                onClick={handleAuth}
                disabled={authorizing}
              >
                {authorizing ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ExternalLink className="mr-2 h-4 w-4" />
                )}
                {t("amocrm.connectAmoCRM")}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={showDisconnectDialog}
        onOpenChange={setShowDisconnectDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("amocrm.disconnectWarningTitle")}</DialogTitle>
            <DialogDescription>
              {t("amocrm.disconnectWarningMessage")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDisconnectDialog(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisconnect}
              disabled={disconnecting}
            >
              {disconnecting ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                t("admin.amocrm.confirm")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showProjectsModal} onOpenChange={setShowProjectsModal}>
        <DialogContent className="sm:max-w-[720px]">
          <DialogHeader>
            <DialogTitle>{t("admin.projectsConfig")}</DialogTitle>
            <DialogDescription>
              {t("amocrm.globalConnectionInfo")}
            </DialogDescription>
          </DialogHeader>

          {connection && (
            <AmoCRMProjectList
              connection={connection}
              open={showProjectsModal}
            />
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowProjectsModal(false)}
            >
              {t("common.close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
