import { supabase } from "./supabase";

export interface PartnerByCode {
  id: string;
  partner_code: string;
  user_profiles: {
    full_name: string | null;
    email: string | null;
  } | null;
}

export async function fetchPartnerByCode(
  refCode: string,
): Promise<PartnerByCode | null> {
  const { data, error } = await supabase
    .from("partner_profiles")
    .select(
      `
      id,
      partner_code,
      user_profiles!partner_profiles_user_id_fkey (
        full_name,
        email
      )
    `,
    )
    .eq("partner_code", refCode)
    .maybeSingle();

  if (error) throw error;

  return (data as PartnerByCode | null) ?? null;
}

export async function linkPartnerToClient(params: {
  authUserId: string;
  partnerId: string | null;
  inviteCode?: string | null;
  email?: string | null;
}) {
  const { authUserId, partnerId, inviteCode, email } = params;

  if (partnerId) {
    const { error: linkError } = await supabase.from("partner_links").insert({
      partner_id: partnerId,
      client_id: authUserId,
      type: "referral",
      status: "active",
      accepted_at: new Date().toISOString(),
    } as never);

    if (linkError) {
      console.error("Error creating partner link:", linkError);
    }
  }

  if (inviteCode && email) {
    const { error: inviteError } = await supabase
      .from("partner_invitations")
      .update({
        status: "accepted",
        accepted_at: new Date().toISOString(),
      } as never)
      .eq("invitation_code", inviteCode)
      .eq("email", email);

    if (inviteError) {
      console.error("Error updating invitation:", inviteError);
    }
  }
}
