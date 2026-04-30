import { Skeleton } from "@gridix/ui";
import { PartnerProgram } from "@gridix/partner-program";
import { JoinDemoButton } from "@/features/demo-cabinet";
import { useAdminAccess } from "@/entities/admin-access";

const PartnersPage = () => {
  const adminAccess = useAdminAccess();

  if (!adminAccess || adminAccess.loading) {
    return (
      <div className="space-y-6">
        <div className="flex gap-2 border-b border-slate-200 pb-2">
          <Skeleton className="h-10 w-28 rounded-lg" />
          <Skeleton className="h-10 w-36 rounded-lg" />
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <Skeleton className="mb-4 h-7 w-[min(320px,100%)]" />
          <Skeleton className="mb-2 h-4 w-full max-w-xl" />
          <Skeleton className="mb-6 h-4 w-4/5 max-w-lg" />
          <div className="flex flex-wrap gap-3">
            <Skeleton className="h-10 w-36" />
            <Skeleton className="h-10 w-28" />
          </div>
        </div>
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
