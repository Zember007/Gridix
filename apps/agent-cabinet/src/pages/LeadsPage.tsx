import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, Input } from "@gridix/ui";
import { supabase } from "@gridix/utils/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { getActiveApplicationId, setActiveApplicationId } from "@/shared/lib/agentContext";

export default function LeadsPage() {
  const { t } = useLanguage();
  const [sp] = useSearchParams();
  const applicationId = sp.get("application_id") || getActiveApplicationId();
  const [q, setQ] = useState("");

  const leadsQuery = useQuery({
    queryKey: ["agent_leads", applicationId],
    enabled: !!applicationId,
    queryFn: async () => {
      if (!applicationId) return [];
      setActiveApplicationId(applicationId);
      const { data, error } = await supabase
        .from("leads")
        .select(
          `
          id,
          created_at,
          name,
          phone,
          email,
          status,
          pipeline_stage_id,
          projects ( name ),
          apartments ( apartment_number, area, price )
        `,
        )
        .eq("agent_id", applicationId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    const rows = leadsQuery.data ?? [];
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((l: any) => {
      const name = String(l.name ?? "").toLowerCase();
      const phone = String(l.phone ?? "").toLowerCase();
      const email = String(l.email ?? "").toLowerCase();
      const proj = String(l.projects?.name ?? "").toLowerCase();
      return name.includes(s) || phone.includes(s) || email.includes(s) || proj.includes(s);
    });
  }, [leadsQuery.data, q]);

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">{t("common.nav.leads")}</h1>
          <div className="text-sm text-slate-500">application_id: {applicationId ?? "—"}</div>
        </div>
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search..."
          className="max-w-xs"
        />
      </div>

      {!applicationId ? (
        <div className="text-sm text-slate-500">Select an application first.</div>
      ) : leadsQuery.isLoading ? (
        <div className="text-sm text-slate-500">{t("common.common.loading")}</div>
      ) : filtered.length === 0 ? (
        <div className="text-sm text-slate-500">No leads.</div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filtered.map((l: any) => {
            const proj = String(l.projects?.name ?? "—");
            const apt = l.apartments;
            const aptLabel = apt?.apartment_number ? `№${apt.apartment_number}` : "—";
            const price = typeof apt?.price === "number" ? `$${apt.price.toLocaleString()}` : "—";
            return (
              <Card key={l.id} className="border-slate-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{l.name || "—"}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-slate-700 space-y-1">
                  <div className="text-xs text-slate-500">{new Date(l.created_at).toLocaleString()}</div>
                  <div>{proj}</div>
                  <div>
                    {aptLabel} • {price}
                  </div>
                  <div className="text-xs text-slate-500">
                    {l.phone || "—"} • {l.email || "—"}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

