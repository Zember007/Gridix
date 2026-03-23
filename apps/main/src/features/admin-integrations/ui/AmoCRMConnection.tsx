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
  ExternalLink,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Settings,
} from "lucide-react";
import { useAmoCRMConnection } from "@/features/admin-integrations/model/useAmoCRMConnection";
import { AmoCRMDisconnectDialog } from "@/features/admin-integrations/ui/AmoCRMDisconnectDialog";
import { AmoCRMProjectsDialog } from "@/features/admin-integrations/ui/AmoCRMProjectsDialog";

interface AmoCRMConnectionProps {
  blockedReason?: "subscription" | "pro" | null;
}

export const AmoCRMConnection = ({
  blockedReason = null,
}: AmoCRMConnectionProps) => {
  const {
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
  } = useAmoCRMConnection();

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
                  disabled={Boolean(blockedReason)}
                >
                  {t("amocrm.disconnect")}
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleAuth}
                  disabled={Boolean(blockedReason)}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {t("amocrm.reconnect")}
                </Button>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowProjectsModal(true)}
                disabled={Boolean(blockedReason)}
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
                disabled={authorizing || Boolean(blockedReason)}
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

      <AmoCRMDisconnectDialog
        open={showDisconnectDialog}
        onOpenChange={setShowDisconnectDialog}
        onDisconnect={handleDisconnect}
        disconnecting={disconnecting}
        t={t}
      />

      <AmoCRMProjectsDialog
        open={showProjectsModal}
        onOpenChange={setShowProjectsModal}
        connection={connection}
        t={t}
      />
    </>
  );
};
