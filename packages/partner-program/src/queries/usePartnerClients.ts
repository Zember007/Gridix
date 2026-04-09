import { useState, useEffect, useCallback } from "react";
import { useCurrentSession } from "@gridix/utils";
import { supabase } from "@gridix/utils/api";
import { usePartnerScopeUserId } from "../PartnerScopeContext";
import type { PartnerClient } from "../model/types";
import { applyDemoPartnerClientsOverlay } from "../model/demoPartnerPublicMock";

export function usePartnerClients() {
  const scopedPartnerUserId = usePartnerScopeUserId();
  const [clients, setClients] = useState<PartnerClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: sessionQuery, isLoading: isSessionLoading } =
    useCurrentSession();

  const sessionUserId = sessionQuery?.user?.id;

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const needsDelegatedStats = Boolean(
        scopedPartnerUserId &&
        sessionUserId &&
        scopedPartnerUserId !== sessionUserId,
      );
      const delegateTargetUserId = needsDelegatedStats
        ? scopedPartnerUserId
        : undefined;
      const statsOwnerUserId = delegateTargetUserId ?? sessionUserId;

      const { data, error: functionError } = await supabase.functions.invoke(
        "partner-program",
        {
          body: {
            action: "get_stats",
            ...(delegateTargetUserId
              ? { partner_id: delegateTargetUserId }
              : {}),
          },
        },
      );

      if (functionError) {
        throw new Error(functionError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      let isDemo = false;
      if (statsOwnerUserId) {
        const { data: prof } = await supabase
          .from("user_profiles")
          .select("is_demo")
          .eq("id", statsOwnerUserId)
          .maybeSingle();
        isDemo = Boolean((prof as { is_demo?: boolean } | null)?.is_demo);
      }

      setClients(
        applyDemoPartnerClientsOverlay(
          (data.clients || []) as PartnerClient[],
          isDemo,
        ),
      );
    } catch (err) {
      console.error("Error fetching partner clients:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch clients");
    } finally {
      setLoading(false);
    }
  }, [sessionUserId, scopedPartnerUserId]);

  useEffect(() => {
    if (isSessionLoading) return;
    void fetchClients();
  }, [isSessionLoading, fetchClients]);

  const addManagedClient = async (clientId: string) => {
    try {
      if (isSessionLoading) {
        throw new Error("Auth session is loading");
      }

      const user = sessionQuery?.user ?? null;

      if (!user) {
        throw new Error("User not authenticated");
      }

      // Получаем ID партнёра
      const { data: partnerProfile } = await supabase
        .from("partner_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!partnerProfile) {
        throw new Error("Partner profile not found");
      }

      // Создаём связь типа 'managed'
      const { data: link, error: linkError } = await supabase
        .from("partner_links")
        .insert({
          partner_id: partnerProfile.id,
          client_id: clientId,
          type: "managed",
          status: "active",
          accepted_at: new Date().toISOString(),
        })
        .select(
          `
          id,
          type,
          status,
          created_at,
          client_id,
          user_profiles!partner_links_client_id_fkey (
            id,
            first_name,
            last_name,
            email
          )
        `,
        )
        .single();

      if (linkError) {
        throw new Error("Failed to create managed relationship");
      }

      // Обновляем список клиентов
      await fetchClients();

      return link;
    } catch (err) {
      console.error("Error adding managed client:", err);
      throw err;
    }
  };

  return {
    clients,
    loading,
    error,
    refetch: fetchClients,
    addManagedClient,
  };
}
