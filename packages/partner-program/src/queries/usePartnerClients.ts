import { useState, useEffect } from "react";
import { useCurrentSession } from "@gridix/utils";
import { supabase } from "@gridix/utils/api";
import type { PartnerClient } from "../model/types";

export function usePartnerClients() {
  const [clients, setClients] = useState<PartnerClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: sessionQuery, isLoading: isSessionLoading } =
    useCurrentSession();

  const fetchClients = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: functionError } = await supabase.functions.invoke(
        "partner-program",
        {
          body: {
            action: "get_stats",
          },
        },
      );

      if (functionError) {
        throw new Error(functionError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setClients(data.clients || []);
    } catch (err) {
      console.error("Error fetching partner clients:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch clients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

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
