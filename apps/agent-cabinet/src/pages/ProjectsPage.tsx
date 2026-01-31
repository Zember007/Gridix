import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@gridix/ui";
import { supabase } from "@gridix/utils/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { getActiveApplicationId, setActiveApplicationId } from "@/shared/lib/agentContext";

type Project = {
  id: string;
  name: string;
  slug: string | null;
  address: string | null;
  building_image_url: string | null;
};

function getMainAppUrl(): string {
  const env = (import.meta as any).env?.VITE_MAIN_APP_URL;
  const raw = typeof env === "string" && env ? env : "https://app.gridix.live";
  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
}

export default function ProjectsPage() {
  const { t, language } = useLanguage();
  const [sp] = useSearchParams();
  const applicationId = sp.get("application_id") || getActiveApplicationId();

  const projectsQuery = useQuery({
    queryKey: ["agent_projects", applicationId],
    enabled: !!applicationId,
    queryFn: async () => {
      if (!applicationId) return [];
      setActiveApplicationId(applicationId);
      const { data, error } = await supabase.functions.invoke("agent-program", {
        body: { action: "list_projects", agent_id: applicationId },
      });
      if (error) throw error;
      return (data?.projects ?? []) as Project[];
    },
  });

  const base = useMemo(() => getMainAppUrl(), []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-black text-slate-900">{t("common.nav.projects")}</h1>
        <p className="text-sm text-slate-500">application_id: {applicationId ?? "—"}</p>
      </div>

      {projectsQuery.isLoading ? (
        <div className="text-sm text-slate-500">{t("common.common.loading")}</div>
      ) : !applicationId ? (
        <div className="text-sm text-slate-500">Select an application first.</div>
      ) : (projectsQuery.data ?? []).length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No projects</CardTitle>
            <CardDescription>Developer hasn't granted access yet.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {(projectsQuery.data ?? []).map((p) => {
            const slug = p.slug ? String(p.slug) : null;
            const url =
              slug && applicationId
                ? `${base}/${language}/project/${slug}?agent_id=${encodeURIComponent(applicationId)}`
                : null;

            return (
              <Card key={p.id} className="overflow-hidden">
                {p.building_image_url ? (
                  <img src={p.building_image_url} alt={p.name} className="h-40 w-full object-cover" />
                ) : (
                  <div className="h-40 w-full bg-slate-200" />
                )}
                <CardHeader>
                  <CardTitle className="text-lg">{p.name}</CardTitle>
                  <CardDescription>{p.address ?? "—"}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    className="w-full"
                    disabled={!url}
                    onClick={() => {
                      if (!url) return;
                      window.open(url, "_blank", "noopener,noreferrer");
                    }}
                  >
                    Open in main app
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

