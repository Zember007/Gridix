import { type User as SupabaseUser } from "@supabase/supabase-js";
import type { Tables } from "@gridix/types/database";
import type { ManagerRole } from "@/hooks/useUserRole";

export type AdminSettingsForm = {
  user_id: string;
  company_name: string;
  full_name: string;
  phone: string;
};

export type CompanySettings = Tables<"company_settings">;

export type TabValue =
  | "company"
  | "billing"
  | "account"
  | "contacts"
  | "notifications"
  | "templates"
  | "data";

export type AdminSettingsControllerProps = {
  userProfile: SupabaseUser;
  loading: boolean;
  developerId?: string;
  isManager?: boolean;
  managerData?: ManagerRole[];
};
