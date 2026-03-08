import { type User as SupabaseUser } from "@supabase/supabase-js";

import { AdminSettingsRoot } from "@/features/admin-settings";
import type { ManagerRole } from "@/hooks/useUserRole";

type AdminSettingsProps = {
  userProfile: SupabaseUser;
  loading: boolean;
  developerId?: string;
  isManager?: boolean;
  managerData?: ManagerRole[];
};

const AdminSettings = (props: AdminSettingsProps) => {
  // TODO: remove wrapper — direct import from @/features/admin-settings
  return <AdminSettingsRoot {...props} />;
};

export default AdminSettings;
