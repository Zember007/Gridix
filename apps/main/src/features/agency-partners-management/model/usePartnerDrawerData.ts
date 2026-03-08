import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/shared/api/supabase";
import type { PartnerDrawerTab } from "../ui/PartnerDrawerTabs";

export interface SignedContract {
  id: string;
  application_id: string;
  contract_template_path: string;
  signed_contract_path: string | null;
  signed_contract_mime: string | null;
  signed_at: string | null;
  template_lang: string | null;
  signed_download_url: string | null;
}

export type PartnerLeadRow = {
  id: string;
  created_at: string | null;
  name: string | null;
  phone: string | null;
  email: string | null;
  status: string | null;
  pipeline_stage_id: string | null;
} & Record<string, unknown>;

type Props = {
  partnerId: string | null;
  activeTab: PartnerDrawerTab;
  leadsSearch: string;
};

export const usePartnerDrawerData = ({
  partnerId,
  activeTab,
  leadsSearch,
}: Props) => {
  const partnerLeadsQuery = useQuery({
    queryKey: ["partner_leads", partnerId],
    enabled: activeTab === "leads" && !!partnerId,
    queryFn: async (): Promise<PartnerLeadRow[]> => {
      if (!partnerId) return [];
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
        .eq("agent_id", partnerId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as PartnerLeadRow[];
    },
  });

  const filteredPartnerLeads = useMemo(() => {
    const q = leadsSearch.trim().toLowerCase();
    const rows = partnerLeadsQuery.data ?? [];
    if (!q) return rows;
    return rows.filter((l) => {
      const n = String(l.name ?? "").toLowerCase();
      const p = String(l.phone ?? "").toLowerCase();
      const e = String(l.email ?? "").toLowerCase();
      const proj = String(
        l.projects && typeof l.projects === "object"
          ? ((l.projects as Record<string, unknown>)?.name ?? "")
          : "",
      ).toLowerCase();
      return (
        n.includes(q) || p.includes(q) || e.includes(q) || proj.includes(q)
      );
    });
  }, [leadsSearch, partnerLeadsQuery.data]);

  const applicationDetailsQuery = useQuery({
    queryKey: ["agent_application", partnerId],
    enabled: !!partnerId,
    queryFn: async () => {
      if (!partnerId) return null;
      const { data, error } = await supabase
        .from("agent_applications")
        .select(
          "id, developer_user_id, agreement_signed, agreement_signed_at, signature_path, signature_method, commission_rate",
        )
        .eq("id", partnerId)
        .single();
      if (error) throw error;
      return data as Record<string, unknown>;
    },
  });

  const signatureUrl = useMemo(() => {
    const path = applicationDetailsQuery.data?.signature_path;
    if (!path) return null;
    return supabase.storage.from("project-images").getPublicUrl(String(path))
      .data.publicUrl;
  }, [applicationDetailsQuery.data]);

  const signedContractsQuery = useQuery({
    queryKey: ["signed_contracts", partnerId],
    enabled: activeTab === "settings" && !!partnerId,
    queryFn: async (): Promise<SignedContract[]> => {
      if (!partnerId) return [];
      const { data, error } = await supabase.functions.invoke("agent-program", {
        body: {
          action: "list_application_signed_contracts",
          application_id: partnerId,
        },
      });
      if (error) throw error;
      return (data?.contracts ?? []) as SignedContract[];
    },
  });

  return {
    partnerLeadsQuery,
    filteredPartnerLeads,
    applicationDetailsQuery,
    signatureUrl,
    signedContractsQuery,
  };
};
