import { PartnerProgram } from "@gridix/partner-program";
import { JoinDemoButton } from "@/features/demo-cabinet";

const PartnersPage = () => {
  return (
    <PartnerProgram
      navigationMode="tabs"
      joinDemoSlot={<JoinDemoButton variant="instructions" />}
    />
  );
};

export default PartnersPage;
