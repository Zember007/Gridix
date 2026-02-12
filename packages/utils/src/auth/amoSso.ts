export interface AmoSsoSupabaseClient {
  functions: {
    invoke: (
      fn: string,
      args: { body: unknown },
    ) => Promise<{ data: any; error: any }>;
  };
  auth: {
    setSession: (args: {
      access_token: string;
      refresh_token: string;
    }) => Promise<{ error: any }>;
  };
}

export async function exchangeAmoSsoToken(
  supabase: AmoSsoSupabaseClient,
  token: string,
): Promise<void> {
  const { data, error } = await supabase.functions.invoke("sso-login", {
    body: { action: "verify", token },
  });

  if (error) throw error;
  if (!data?.access_token || !data?.refresh_token) {
    throw new Error("Invalid SSO session payload");
  }

  const { error: setError } = await supabase.auth.setSession({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
  });
  if (setError) throw setError;
}

