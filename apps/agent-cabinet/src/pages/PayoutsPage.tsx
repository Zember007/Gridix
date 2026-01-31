import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@gridix/ui";
import { supabase } from "@gridix/utils/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { getActiveApplicationId, setActiveApplicationId } from "@/shared/lib/agentContext";

type PayoutRow = {
  id: string;
  agent_id: string | null;
  amount: number;
  status: string;
  method: string | null;
  payout_date: string;
  created_at: string;
};

export default function PayoutsPage() {
  const { t } = useLanguage();
  const [sp] = useSearchParams();
  const applicationId = sp.get("application_id") || getActiveApplicationId();

  const payoutsQuery = useQuery({
    queryKey: ["agent_payouts", applicationId],
    enabled: !!applicationId,
    queryFn: async () => {
      if (!applicationId) return [];
      setActiveApplicationId(applicationId);
      const { data, error } = await supabase
        .from("agent_payouts")
        .select("id, agent_id, amount, status, method, payout_date, created_at")
        .eq("agent_id", applicationId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as PayoutRow[];
    },
  });

  const totals = useMemo(() => {
    const rows = payoutsQuery.data ?? [];
    let pending = 0;
    let paid = 0;
    for (const r of rows) {
      const amt = typeof r.amount === "number" ? r.amount : 0;
      if (String(r.status) === "paid") paid += amt;
      else pending += amt;
    }
    return { pending: Math.round(pending * 100) / 100, paid: Math.round(paid * 100) / 100 };
  }, [payoutsQuery.data]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-black text-slate-900">{t("common.nav.payouts")}</h1>
        <div className="text-sm text-slate-500">application_id: {applicationId ?? "—"}</div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Pending</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-black text-amber-600 font-mono">
            ${totals.pending.toLocaleString()}
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Paid</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-black text-slate-900 font-mono">
            ${totals.paid.toLocaleString()}
          </CardContent>
        </Card>
      </div>

      {!applicationId ? (
        <div className="text-sm text-slate-500">Select an application first.</div>
      ) : payoutsQuery.isLoading ? (
        <div className="text-sm text-slate-500">{t("common.common.loading")}</div>
      ) : (payoutsQuery.data ?? []).length === 0 ? (
        <div className="text-sm text-slate-500">No payouts.</div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {(payoutsQuery.data ?? []).map((p) => (
            <Card key={p.id} className="border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-mono">${p.amount.toLocaleString()}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-700 space-y-1">
                <div className="text-xs text-slate-500">{new Date(p.created_at).toLocaleString()}</div>
                <div>Status: {p.status}</div>
                <div>Method: {p.method ?? "—"}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

