import { supabase } from "@gridix/utils/api";
import type { UserProfileRow } from "@/entities/agent-profile";

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
