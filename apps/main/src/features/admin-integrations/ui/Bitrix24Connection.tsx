import { useEffect, useState } from "react";
import { Bitrix24ProjectList } from "@/features/admin-integrations/bitrix24-project-config";
import { Button, Input } from "@gridix/ui";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@gridix/ui";
import { Badge } from "@gridix/ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@gridix/ui";
import { ExternalLink, CheckCircle, RefreshCw, Settings } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/shared/api/supabase";
import { useLanguage } from "@/contexts/LanguageContext";
import { trackUsertourEvent } from "@gridix/utils/integrations";

type CRMConnection = {
  id: string;
  crm_type: string;
  subdomain: string;
  base_domain: string | null;
  token_expires_at: string | null;
};

const useBitrix24Connection = () => {
  const { t } = useLanguage();
  const [connection, setConnection] = useState<CRMConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
  const [showProjectsModal, setShowProjectsModal] = useState(false);
  const [domain, setDomain] = useState("");
  const [domainError, setDomainError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  const checkConnection = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("bitrix-app", {
        body: { action: "bitrix_get_state" },
      });
      if (error) throw error;
      // Only treat as connected when tokens are valid — a pre-inserted row without
      // tokens returns token_valid: false and must not be shown as active.
      setConnection(
        data?.connection && data?.token_valid !== false
          ? data.connection
          : null,
      );
    } catch (error) {
      console.error("Error checking Bitrix24:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  useEffect(() => {
    if (!connection) return;
    void trackUsertourEvent({
      eventName: "gridix_crm_connected",
      properties: { crm: "bitrix24" },
      onceKey: "gridix_crm_connected",
    });
  }, [connection]);

  const handleConnect = async () => {
    const norm = domain
      .trim()
      .replace(/^https?:\/\//, "")
      .replace(/\/.*$/, "");
    if (!norm) {
      setDomainError(t("admin.bitrix24.invalidDomain"));
      return;
    }
    if (norm.toLowerCase().endsWith(".ru")) {
      setDomainError(t("admin.bitrix24.ruRegionUnavailable"));
      return;
    }
    setDomainError(null);
    setConnecting(true);
    try {
      const subdomain = norm.split(".")[0] ?? norm;
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: existing } = await supabase
        .from("crm_connections")
        .select("id")
        .eq("user_id", user.id)
        .eq("crm_type", "bitrix24")
        .eq("subdomain", subdomain)
        .maybeSingle();

      if (!existing) {
        const { error } = await supabase.from("crm_connections").insert({
          user_id: user.id,
          crm_type: "bitrix24",
          subdomain,
          base_domain: norm,
        });
        if (error) throw error;
      }

      window.location.href = `https://${norm}/market/detail/gridix.live/`;
    } catch (e) {
      console.error(e);
      toast.error(t("admin.bitrix24.connectError"));
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setBusy(true);
      if (connection) {
        const { error } = await supabase
          .from("crm_connections")
          .delete()
          .eq("id", connection.id);
        if (error) throw error;
      }
      setConnection(null);
      setShowDisconnectDialog(false);
      toast.success(t("admin.bitrix24.disconnectSuccess"));
    } catch (error) {
      console.error("Error disconnecting Bitrix24:", error);
      toast.error(t("admin.bitrix24.disconnectError"));
    } finally {
      setBusy(false);
    }
  };

  return {
    t,
    connection,
    loading,
    busy,
    showDisconnectDialog,
    setShowDisconnectDialog,
    showProjectsModal,
    setShowProjectsModal,
    handleDisconnect,
    domain,
    setDomain,
    domainError,
    connecting,
    handleConnect,
  };
};

export const Bitrix24Connection = () => {
  const {
    t,
    connection,
    loading,
    busy,
    showDisconnectDialog,
    setShowDisconnectDialog,
    showProjectsModal,
    setShowProjectsModal,
    handleDisconnect,
    domain,
    setDomain,
    domainError,
    connecting,
    handleConnect,
  } = useBitrix24Connection();

  if (loading) {
    return (
      <div className="flex h-full animate-pulse items-center justify-center rounded-xl bg-muted/50" />
    );
  }

  return (
    <>
      <Card className="flex flex-col overflow-hidden border-none shadow-md transition-all duration-300 hover:shadow-lg">
        <div className="h-2 w-full bg-[#2fc6f6]" />
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle className="flex items-center gap-2 text-xl">
              <div className="overflow-hidden rounded-lg">
                <img
                  src="/images/bitrixLogo.jpeg"
                  alt="Bitrix24"
                  className="h-16 w-16 object-contain"
                />
              </div>
            </CardTitle>
            {connection ? (
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-700 hover:bg-green-200"
              >
                {t("admin.common.active")}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground">
                {t("admin.common.inactive")}
              </Badge>
            )}
          </div>
          <CardDescription className="mt-2">
            {t("admin.bitrix24.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="mt-auto">
          {connection ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-lg border border-green-100 bg-green-50/50 p-3">
                <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-green-900">
                    {t("admin.bitrix24.connectedTo")}{" "}
                    <span className="font-bold">
                      {connection.base_domain || connection.subdomain}
                    </span>
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full border-red-200 text-red-600 hover:bg-red-50"
                onClick={() => setShowDisconnectDialog(true)}
              >
                {t("admin.bitrix24.disconnect")}
              </Button>

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
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {t("admin.bitrix24.enterDomain")}
              </p>
              <Input
                value={domain}
                onChange={(e) => {
                  setDomain(e.target.value);
                }}
                placeholder={t("admin.bitrix24.domainPlaceholder")}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void handleConnect();
                }}
              />
              {domainError && (
                <p className="text-xs text-red-600">{domainError}</p>
              )}
              <Button
                className="w-full bg-[#2fc6f6] text-white hover:bg-[#20b0dd]"
                onClick={() => void handleConnect()}
                disabled={connecting}
              >
                {connecting ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ExternalLink className="mr-2 h-4 w-4" />
                )}
                {t("admin.bitrix24.openMarketplace")}
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
            <DialogTitle>
              {t("admin.bitrix24.disconnectWarningTitle")}
            </DialogTitle>
            <DialogDescription>
              {t("admin.bitrix24.disconnectWarningMessage")}
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
              disabled={busy}
            >
              {busy ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                t("admin.common.confirm")
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
              {t("admin.bitrix24.configureProjectDesc")}
            </DialogDescription>
          </DialogHeader>

          {connection && (
            <Bitrix24ProjectList
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
