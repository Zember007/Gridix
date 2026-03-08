import { supabase } from "@/shared/api/supabase";

type InvokePayload = Record<string, unknown> | FormData;

export async function invokeAgentProgram(payload: InvokePayload) {
  const { data, error } = await supabase.functions.invoke("agent-program", {
    body: payload,
  });
  if (error) {
    throw error;
  }
  return data;
}
