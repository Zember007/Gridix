import { supabase } from "@gridix/utils/api";
import type { ManagerAccount } from "../model/types";

export const fetchManagerAccounts = async (
  developerId: string,
): Promise<ManagerAccount[]> => {
  const { data, error } = await supabase
    .from("manager_accounts")
    .select("*")
    .eq("developer_id", developerId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []) as ManagerAccount[];
};

export const suspendManager = async (managerId: string): Promise<void> => {
  const { error } = await supabase
    .from("manager_accounts")
    .update({ status: "suspended" })
    .eq("id", managerId);

  if (error) throw error;
};

export const activateManager = async (managerId: string): Promise<void> => {
  const { error } = await supabase
    .from("manager_accounts")
    .update({ status: "active" })
    .eq("id", managerId);

  if (error) throw error;
};

export const removeManager = async (managerId: string): Promise<void> => {
  const { error } = await supabase
    .from("manager_accounts")
    .delete()
    .eq("id", managerId);

  if (error) throw error;
};
