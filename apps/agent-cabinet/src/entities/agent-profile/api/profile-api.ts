import { supabase } from "@gridix/utils/api";
import type { UserProfileRow } from "../model/types";

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
