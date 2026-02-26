import { supabase } from "@gridix/utils/api";

interface CheckUserExistsResult {
  exists: boolean;
  accountType: string | null;
}

export const checkUserExists = async (
  email: string,
): Promise<CheckUserExistsResult | null> => {
  const { data, error } = await supabase.functions.invoke("check-user-exists", {
    body: { email },
  });

  if (error || !data) return null;
  return { exists: !!data.exists, accountType: data.accountType };
};

interface SendInvitationParams {
  email: string;
  full_name: string;
  phone: string;
  developer_name: string;
  company_name: string;
  invitation_token: string;
  project_ids?: string[];
  password?: string;
}

interface SendInvitationResult {
  success: boolean;
  error?: string;
  already_registered?: boolean;
}

export const sendManagerInvitation = async (
  params: SendInvitationParams,
): Promise<SendInvitationResult> => {
  const { data, error } = await supabase.functions.invoke(
    "send-manager-invitation",
    { body: params },
  );

  if (error) throw error;
  return data as SendInvitationResult;
};

export const generateInvitationToken = async (): Promise<string> => {
  const { data, error } = await supabase.rpc("generate_invitation_token");
  if (error) throw error;
  return data;
};
