import { Loader2 } from "lucide-react";
import { PartnerProgram } from "@gridix/partner-program";
import { JoinDemoButton } from "@/features/demo-cabinet";
import { useAdminAccess } from "@/entities/admin-access";

const PartnersPage = () => {
  const adminAccess = useAdminAccess();

  if (!adminAccess || adminAccess.loading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" aria-hidden />
      </div>
    );
  }

  const readOnly = adminAccess.isDemoViewer ?? false;
  const scopedPartnerUserId = adminAccess.data?.viewer?.effective_developer_id;

  return (
    <PartnerProgram
      navigationMode="tabs"
      joinDemoSlot={<JoinDemoButton variant="instructions" />}
      readOnly={readOnly}
      scopedPartnerUserId={scopedPartnerUserId}
    />
  );
};

export default PartnersPage;
