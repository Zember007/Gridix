import { supabase } from "@gridix/utils/api";

export async function updateMySignature(args: {
  signatureDataUrl: string;
  signatureMethod: "draw" | "upload";
}): Promise<void> {
  const { data, error } = await supabase.functions.invoke("agent-program", {
    body: {
      action: "update_my_signature",
      signature_data_url: args.signatureDataUrl,
      signature_method: args.signatureMethod,
    },
  });
  if (error) throw error;
  if ((data as { success?: boolean })?.success !== true) {
    throw new Error("Failed");
  }
}
