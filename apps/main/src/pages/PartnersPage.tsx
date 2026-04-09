import { PartnerProgram } from "@gridix/partner-program";
import { JoinDemoButton } from "@/features/demo-cabinet";
import { useAdminAccess } from "@/entities/admin-access";

const PartnersPage = () => {
  const adminAccess = useAdminAccess();
  const readOnly = adminAccess?.isDemoViewer ?? false;

  return (
    <PartnerProgram
      navigationMode="tabs"
      joinDemoSlot={<JoinDemoButton variant="instructions" />}
      readOnly={readOnly}
    />
  );
};

export default PartnersPage;
