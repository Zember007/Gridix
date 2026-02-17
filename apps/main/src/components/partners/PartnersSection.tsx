import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@gridix/ui";
import { Button } from "@gridix/ui";
import { Badge } from "@gridix/ui";
import { Copy, Users, DollarSign, TrendingUp, Handshake } from "lucide-react";
import { usePartner } from "../../hooks/usePartner";
import { usePartnerStats } from "../../hooks/usePartnerStats";
import { useToast } from "@gridix/ui";
import { useLanguage } from "@gridix/utils/react";

export function PartnersSection() {
  const {
    isPartner,
    partnerProfile,
    loading: partnerLoading,
    createPartnerProfile,
  } = usePartner();
  const { stats, loading: statsLoading } = usePartnerStats();
  const { toast } = useToast();
  const [creating, setCreating] = useState(false);
  const { language, t } = useLanguage();

  const handleCreatePartner = async () => {
    try {
      setCreating(true);
      await createPartnerProfile();
      toast({
        title: t("partners.profileCreated"),
        description: t("partners.profileCreatedDesc"),
      });
    } catch (error) {
      toast({
        title: t("partners.error"),
        description: t("partners.profileCreationFailed"),
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const copyReferralLink = async () => {
    if (!partnerProfile) return;

    const ssoBase = (import.meta as any).env?.VITE_SSO_URL as
      | string
      | undefined;
    const baseOrigin =
      ssoBase && typeof ssoBase === "string" && ssoBase.length > 0
        ? ssoBase.replace(/\/$/, "")
        : window.location.origin;
    const referralLink = `${baseOrigin}/${language}/auth/signup?ref=${partnerProfile.partner_code}`;

    try {
      await navigator.clipboard.writeText(referralLink);
      toast({
        title: t("partners.linkCopied"),
        description: t("partners.linkCopiedDesc"),
      });
    } catch (error) {
      toast({
        title: t("partners.error"),
        description: t("partners.copyFailed"),
        variant: "destructive",
      });
    }
  };

  if (partnerLoading || statsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 w-3/4 rounded bg-gray-200"></div>
                <div className="h-3 w-1/2 rounded bg-gray-200"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 w-1/2 rounded bg-gray-200"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!isPartner) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Handshake className="h-5 w-5" />
              {t("partners.title")}
            </CardTitle>
            <CardDescription>{t("partners.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="font-medium">
                    {t("partners.referralProgram")}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {t("partners.referralProgramDesc")}
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">{t("partners.fullSupport")}</h4>
                  <p className="text-sm text-muted-foreground">
                    {t("partners.fullSupportDesc")}
                  </p>
                </div>
              </div>
              <Button
                onClick={handleCreatePartner}
                disabled={creating}
                className="w-full"
              >
                {creating
                  ? t("partners.creating")
                  : t("partners.becomePartner")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Статистика */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("partners.totalClients")}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.total_clients || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.referral_clients || 0} {t("partners.referralClients")},{" "}
              {stats?.managed_clients || 0} {t("partners.managedClients")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("partners.earned")}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats?.total_earned || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("partners.availableForWithdrawal")}: $
              {stats?.available_for_withdrawal || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("partners.partnerCode")}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="font-mono">
                {partnerProfile?.partner_code}
              </Badge>
              <Button size="sm" variant="outline" onClick={copyReferralLink}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Блок последних клиентов перенесен во вкладку рефералов */}
    </div>
  );
}
