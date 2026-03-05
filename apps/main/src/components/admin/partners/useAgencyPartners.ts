import { useEffect, useMemo, useState } from "react";
import { AgencyPartner, PartnerFilter, PayoutItem } from "./types";
import { supabase } from "@gridix/utils/api";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import type { Database } from "@gridix/types/database";

export function useAgencyPartners() {
  const [partners, setPartners] = useState<AgencyPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<PartnerFilter>({
    search: "",
    status: "all",
    type: "all",
    minCommission: undefined,
    maxCommission: undefined,
    dateFrom: undefined,
    dateTo: undefined,
  });
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const { activeWorkspaceId, isManagerMode } = useWorkspace();

  const developerId = isManagerMode ? activeWorkspaceId : (user?.id ?? null);

  const toNonEmptyString = (value: unknown): string | undefined => {
    if (typeof value !== "string") return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  };

  const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null;

  const isJsonLikeString = (value: string): boolean => {
    const trimmed = value.trim();
    return (
      (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
      (trimmed.startsWith("[") && trimmed.endsWith("]"))
    );
  };

  const parseVatPayer = (value: unknown): boolean | undefined => {
    if (typeof value === "boolean") return value;
    if (typeof value !== "string") return undefined;
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes"].includes(normalized)) return true;
    if (["false", "0", "no"].includes(normalized)) return false;
    return undefined;
  };

  const parseBankDetails = (value: unknown): AgencyPartner["bankDetails"] => {
    const fromRecord = (
      record: Record<string, unknown>,
    ): AgencyPartner["bankDetails"] => {
      const bankName = toNonEmptyString(record.bank_name);
      const iban = toNonEmptyString(record.iban);
      const billingCurrency = toNonEmptyString(record.billing_currency);
      const isVatPayer = parseVatPayer(record.is_vat_payer);
      const detailsRaw = toNonEmptyString(record.details);
      const details =
        detailsRaw && !isJsonLikeString(detailsRaw) ? detailsRaw : undefined;

      return {
        details,
        bank_name: bankName ?? null,
        iban: iban ?? null,
        billing_currency: billingCurrency ?? null,
        is_vat_payer: isVatPayer ?? null,
      };
    };

    if (isRecord(value)) {
      return fromRecord(value);
    }

    const raw = toNonEmptyString(value);
    if (!raw) return { details: "" };

    try {
      const parsed = JSON.parse(raw);
      if (isRecord(parsed)) return fromRecord(parsed);
    } catch {
      // Not a JSON payload, keep as plain text fallback.
    }

    return {
      details: isJsonLikeString(raw) ? "" : raw,
    };
  };

  const fetchPartners = async () => {
    try {
      setLoading(true);
      if (!developerId) {
        setPartners([]);
        return;
      }

      const { data, error } = await supabase
        .from("agent_applications")
        .select("*")
        .eq("developer_user_id", developerId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      type AgentApplicationRow =
        Database["public"]["Tables"]["agent_applications"]["Row"];

      // Map DB rows to AgencyPartner type
      const rows: AgentApplicationRow[] = data ?? [];
      const mappedPartners: AgencyPartner[] = rows.map((item) => {
        const dbStatus = String(item.status || "pending");
        const uiStatus: AgencyPartner["status"] =
          dbStatus === "approved"
            ? "active"
            : dbStatus === "needs_correction"
              ? "needs_correction"
              : dbStatus === "blocked" || dbStatus === "rejected"
                ? "blocked"
                : // fallback for unexpected values
                  "pending";

        return {
          id: item.id,
          name: item.full_name,
          type: (item.type || "individual") as "agency" | "individual",
          contactPerson: item.full_name,
          phone: item.phone,
          email: item.email,
          status: uiStatus,
          rejectionReason: item.rejection_reason ?? undefined,
          commissionRate: item.commission_rate || 4,
          source: "website",
          joinedAt: item.created_at,
          agreementSigned: item.agreement_signed || false,
          bankDetails: parseBankDetails(item.bank_details),
          stats: {
            totalLeads: 0,
            activeDeals: 0,
            closedDeals: 0,
            totalRevenue: 0,
            commissionPaid: 0,
            commissionPending: 0,
          },
        };
      });

      // Enrich stats: leads + commission (agent_payouts)
      const agentIds = mappedPartners.map((p) => p.id);
      const [leadsRes, payoutsRes] = await Promise.all([
        agentIds.length
          ? supabase
              .from("leads")
              .select("id, agent_id")
              .in("agent_id", agentIds)
          : Promise.resolve({ data: [], error: null } as any),
        agentIds.length
          ? supabase
              .from("agent_payouts")
              .select("agent_id, amount, status")
              .in("agent_id", agentIds)
          : Promise.resolve({ data: [], error: null } as any),
      ]);

      if (leadsRes.error) throw leadsRes.error;
      if (payoutsRes.error) throw payoutsRes.error;

      const leadCounts = new Map<string, number>();
      for (const row of (leadsRes.data ?? []) as Array<{
        agent_id: string | null;
      }>) {
        if (!row.agent_id) continue;
        leadCounts.set(row.agent_id, (leadCounts.get(row.agent_id) ?? 0) + 1);
      }

      const payoutAgg = new Map<string, { pending: number; paid: number }>();
      for (const row of (payoutsRes.data ?? []) as Array<{
        agent_id: string | null;
        amount: number;
        status: string;
      }>) {
        if (!row.agent_id) continue;
        const entry = payoutAgg.get(row.agent_id) ?? { pending: 0, paid: 0 };
        const amount = typeof row.amount === "number" ? row.amount : 0;
        if (String(row.status) === "paid") entry.paid += amount;
        else entry.pending += amount;
        payoutAgg.set(row.agent_id, entry);
      }

      setPartners(
        mappedPartners.map((p) => {
          const leadCount = leadCounts.get(p.id) ?? 0;
          const pa = payoutAgg.get(p.id) ?? { pending: 0, paid: 0 };
          return {
            ...p,
            stats: {
              ...p.stats,
              totalLeads: leadCount,
              commissionPending: Math.round(pa.pending * 100) / 100,
              commissionPaid: Math.round(pa.paid * 100) / 100,
            },
          };
        }),
      );
    } catch (error: unknown) {
      console.error("Error fetching partners:", error);
      toast.error(t("partners.agencyNotifications.loadError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [developerId]);

  const filteredPartners = useMemo(() => {
    return partners.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        p.phone.includes(filters.search) ||
        p.email.toLowerCase().includes(filters.search.toLowerCase());
      const matchesStatus =
        filters.status === "all" || p.status === filters.status;
      const matchesType = filters.type === "all" || p.type === filters.type;

      const min =
        typeof filters.minCommission === "number"
          ? filters.minCommission
          : null;
      const max =
        typeof filters.maxCommission === "number"
          ? filters.maxCommission
          : null;
      const matchesCommission =
        (min === null || p.commissionRate >= min) &&
        (max === null || p.commissionRate <= max);

      const from =
        typeof filters.dateFrom === "string" && filters.dateFrom
          ? new Date(filters.dateFrom)
          : null;
      const to =
        typeof filters.dateTo === "string" && filters.dateTo
          ? new Date(filters.dateTo)
          : null;
      // inclusive: [from, to+1day)
      const joinedAt = new Date(p.joinedAt);
      const toEnd = to ? new Date(to) : null;
      if (toEnd) toEnd.setDate(toEnd.getDate() + 1);
      const matchesDate =
        (!from || joinedAt >= from) && (!toEnd || joinedAt < toEnd);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesType &&
        matchesCommission &&
        matchesDate
      );
    });
  }, [partners, filters]);

  const approvePartner = async (id: string) => {
    try {
      const siteUrl =
        typeof window !== "undefined" ? window.location.origin : undefined;
      const { data, error } = await supabase.functions.invoke("agent-program", {
        body: {
          action: "approve_application",
          application_id: id,
          lang: language,
          site_url: siteUrl,
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Approve failed");

      setPartners((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: "active" } : p)),
      );
      toast.success(t("partners.agencyNotifications.activated"));
    } catch (error: unknown) {
      console.error("approvePartner error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : t("partners.agencyNotifications.activateError"),
      );
    }
  };

  const updatePartnerStatus = async (
    id: string,
    status: AgencyPartner["status"],
    rejectionReason?: string,
  ) => {
    try {
      const dbStatus =
        status === "active"
          ? "approved"
          : status === "needs_correction"
            ? "needs_correction"
            : status === "blocked"
              ? "blocked"
              : "pending";

      const { data, error } = await supabase.functions.invoke("agent-program", {
        body: {
          action: "update_application_status",
          application_id: id,
          status: dbStatus,
          rejection_reason:
            status === "needs_correction" ? rejectionReason : undefined,
        },
      });

      if (error) throw error;
      if (!data?.success)
        throw new Error(data?.error || "Status update failed");

      setPartners((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status, rejectionReason } : p)),
      );
      toast.success(t("partners.agencyNotifications.statusUpdated"));
    } catch (error: unknown) {
      console.error("updatePartnerStatus error:", error);
      toast.error(t("partners.agencyNotifications.statusUpdateError"));
    }
  };

  const updatePartnerCommission = async (id: string, rate: number) => {
    try {
      const { error } = await supabase
        .from("agent_applications")
        .update({ commission_rate: rate })
        .eq("id", id);

      if (error) throw error;

      setPartners((prev) =>
        prev.map((p) => (p.id === id ? { ...p, commissionRate: rate } : p)),
      );
      toast.success(t("partners.agencyNotifications.rateUpdated"));
    } catch (error: unknown) {
      toast.error(t("partners.agencyNotifications.rateUpdateError"));
    }
  };

  const markPaid = async (payoutIds: string[]) => {
    try {
      if (payoutIds.length === 0) return;

      const nowIso = new Date().toISOString();
      const { error } = await supabase
        .from("agent_payouts")
        .update({ status: "paid", payout_date: nowIso })
        .in("id", payoutIds);

      if (error) throw error;

      toast.success(t("partners.agencyNotifications.markedPaid"));
      fetchPartners(); // Refresh stats
    } catch (error: unknown) {
      toast.error(t("partners.agencyNotifications.payoutStatusError"));
    }
  };

  const getPendingPayouts = async (
    partnerId: string,
  ): Promise<PayoutItem[]> => {
    try {
      const { data, error } = await supabase
        .from("agent_payouts")
        .select("*")
        .eq("agent_id", partnerId)
        .eq("status", "pending");

      if (error) throw error;

      // Extract lead IDs from 'method' (format 'sale:UUID')
      const leadIds = (data ?? [])
        .map((p) => {
          const m = String(p.method || "");
          return m.startsWith("sale:") ? m.split(":")[1] : null;
        })
        .filter(Boolean) as string[];

      // Fetch lead names if any
      const leadNames = new Map<string, string>();
      if (leadIds.length > 0) {
        const { data: leadsData } = await supabase
          .from("leads")
          .select("id, name")
          .in("id", leadIds);

        leadsData?.forEach((l) => leadNames.set(l.id, l.name || ""));
      }

      return (
        data?.map((p) => {
          const methodStr = String(p.method || "");
          const leadId = methodStr.startsWith("sale:")
            ? methodStr.split(":")[1]
            : null;
          return {
            id: p.id,
            amount: Number(p.amount || 0),
            date: p.payout_date || p.created_at,
            leadName: leadId ? leadNames.get(leadId) || null : null,
            leadId: leadId || null,
          };
        }) || []
      );
    } catch (error) {
      console.error("Error fetching pending payouts:", error);
      return [];
    }
  };

  const deletePartner = async (partnerId: string) => {
    if (isManagerMode) {
      toast.error(t("partners.agencyNotifications.managerCannotDelete"));
      return;
    }

    try {
      const { error } = await supabase
        .from("agent_applications")
        .delete()
        .eq("id", partnerId);

      if (error) throw error;

      toast.success(t("partners.agencyNotifications.deleted"));
      fetchPartners();
    } catch (error: unknown) {
      toast.error(t("partners.agencyNotifications.deleteError"));
    }
  };

  const stats = useMemo(() => {
    return {
      totalPartners: partners.length,
      activePartners: partners.filter((p) => p.status === "active").length,
      totalSalesVolume: partners.reduce(
        (acc, p) => acc + p.stats.totalRevenue,
        0,
      ),
      pendingRequests: partners.filter(
        (p) => p.status === "pending" || p.status === "needs_correction",
      ).length,
      totalPendingCommission: partners.reduce(
        (acc, p) => acc + p.stats.commissionPending,
        0,
      ),
    };
  }, [partners]);

  return {
    developerId,
    isManagerMode,
    partners: filteredPartners,
    loading,
    filters,
    setFilters,
    approvePartner,
    updatePartnerStatus,
    updatePartnerCommission,
    markPaid,
    getPendingPayouts,
    deletePartner,
    stats,
    refresh: fetchPartners,
  };
}
