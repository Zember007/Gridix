import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@gridix/ui";
import { supabase } from "@gridix/utils/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { setActiveApplicationId } from "@/shared/lib/agentContext";
import { useNavigate } from "react-router-dom";

type AgentApplication = {
  id: string;
  developer_user_id: string | null;
  status: string;
  full_name: string;
  email: string;
  phone: string;
  commission_rate: number | null;
  agreement_signed: boolean | null;
  signature_url?: string | null;
};

export default function DashboardPage() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const appsQuery = useQuery({
    queryKey: ["my_applications"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("agent-program", {
        body: { action: "list_my_applications" },
      });
      if (error) throw error;
      return (data?.applications ?? []) as AgentApplication[];
    },
  });

  const stats = useMemo(() => {
    const list = appsQuery.data ?? [];
    const approved = list.filter((a) => String(a.status) === "approved").length;
    return { total: list.length, approved };
  }, [appsQuery.data]);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">{t("common.nav.dashboard")}</h1>
          <p className="text-sm text-slate-500">
            {stats.total} • {t("common.agent.status.approved")}: {stats.approved}
          </p>
        </div>
        <Button onClick={() => navigate(`/${language}/application`)}>{t("common.nav.application")}</Button>
      </div>

      {appsQuery.isLoading ? (
        <div className="text-sm text-slate-500">{t("common.common.loading")}</div>
      ) : (appsQuery.data ?? []).length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>{t("common.agent.application.title")}</CardTitle>
            <CardDescription>Start by submitting an application from an invite link.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {(appsQuery.data ?? []).map((a) => (
            <Card key={a.id} className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg">{a.full_name}</CardTitle>
                <CardDescription className="flex flex-wrap gap-2">
                  <span className="font-mono text-xs">{a.id}</span>
                  <span className="text-xs text-slate-500">
                    {String(a.status) === "approved"
                      ? t("common.agent.status.approved")
                      : String(a.status) === "rejected"
                        ? t("common.agent.status.rejected")
                        : t("common.agent.status.pending")}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-xs text-slate-600">
                  <div>{a.email}</div>
                  <div>{a.phone}</div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setActiveApplicationId(a.id);
                      navigate(`/${language}/projects?application_id=${a.id}`);
                    }}
                    disabled={String(a.status) !== "approved"}
                  >
                    {t("common.nav.projects")}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setActiveApplicationId(a.id);
                      navigate(`/${language}/leads?application_id=${a.id}`);
                    }}
                  >
                    {t("common.nav.leads")}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setActiveApplicationId(a.id);
                      navigate(`/${language}/payouts?application_id=${a.id}`);
                    }}
                  >
                    {t("common.nav.payouts")}
                  </Button>
                  <Button
                    onClick={() => {
                      setActiveApplicationId(a.id);
                      navigate(`/${language}/application?application_id=${a.id}`);
                    }}
                  >
                    {t("common.nav.application")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

