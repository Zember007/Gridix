import { supabase } from "@gridix/utils/api";
import type {
  AgentApplicationSettings,
  SignedContract,
  UserProfileRow,
} from "../model/types";

export async function getMyUserProfile(
  userId: string,
): Promise<UserProfileRow | null> {
  const { data, error } = await supabase
    .from("user_profiles")
    .select(
      [
        "id",
        "email",
        "full_name",
        "company_name",
        "phone",
        "preferred_locale",
        "person_type",
        "tax_id",
        "legal_address",
        "bank_name",
        "iban",
        "billing_currency",
        "is_vat_payer",
        "company_type",
        "registered_office",
        "representative_name",
        "representative_title",
        "signature_path",
        "signature_method",
        "signature_meta",
      ].join(", "),
    )
    .eq("id", userId)
    .single();
  if (error) throw error;
  return data as unknown as UserProfileRow;
}

export async function getAgentContractSettings(
  applicationId: string,
): Promise<AgentApplicationSettings | null> {
  const { data, error } = await supabase.functions.invoke("agent-program", {
    body: { action: "get_agent_settings", application_id: applicationId },
  });
  if (error) throw error;
  const resp = data as {
    success?: boolean;
    application?: AgentApplicationSettings;
  };
  if (!resp?.success || !resp.application) return null;
  return resp.application;
}

export async function listMySignedContracts(
  applicationId: string,
): Promise<SignedContract[]> {
  const { data, error } = await supabase.functions.invoke("agent-program", {
    body: {
      action: "list_my_signed_contracts",
      application_id: applicationId,
    },
  });
  if (error) throw error;
  const resp = data as { success?: boolean; contracts?: unknown };
  const list = Array.isArray(resp?.contracts)
    ? (resp.contracts as unknown[])
    : [];

  return list.map((c) => {
    const item = c as Record<string, unknown>;
    return {
      id: String(item.id),
      signed_at: item.signed_at ? String(item.signed_at) : null,
      signed_download_url: item.signed_download_url
        ? String(item.signed_download_url)
        : null,
      signed_contract_mime: item.signed_contract_mime
        ? String(item.signed_contract_mime)
        : null,
      template_lang: item.template_lang ? String(item.template_lang) : null,
    };
  });
}

export async function updateMyUserProfile(
  userId: string,
  profileForm: Partial<UserProfileRow>,
): Promise<void> {
  const payload = {
    full_name: profileForm.full_name ?? null,
    company_name: profileForm.company_name ?? null,
    phone: profileForm.phone ?? null,
    preferred_locale: profileForm.preferred_locale ?? "en",
    person_type: profileForm.person_type ?? null,
    tax_id: profileForm.tax_id ?? null,
    legal_address: profileForm.legal_address ?? null,
    bank_name: profileForm.bank_name ?? null,
    iban: profileForm.iban ?? null,
    billing_currency: profileForm.billing_currency ?? null,
    is_vat_payer:
      typeof profileForm.is_vat_payer === "boolean"
        ? profileForm.is_vat_payer
        : null,
    company_type: profileForm.company_type ?? null,
    registered_office: profileForm.registered_office ?? null,
    representative_name: profileForm.representative_name ?? null,
    representative_title: profileForm.representative_title ?? null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("user_profiles")
    .update(payload)
    .eq("id", userId);
  if (error) throw error;
}
