// Main component
export { PartnerProgram } from './PartnerProgram';
export type { PartnerProgramProps, PartnerSection } from './PartnerProgram';

// Hooks (re-exported for consumers that need them directly)
export { usePartner } from './queries/usePartner';
export { usePartnerStats } from './queries/usePartnerStats';
export { usePartnerClients } from './queries/usePartnerClients';
export { usePartnerAccountData } from './queries/usePartnerAccountData';

// Types
export type {
  PartnerProfile,
  PartnerLink,
  PartnerCommission,
  PartnerPayout,
  PartnerStats,
  PartnerClient,
  PartnerProgramRequest,
  PartnerProgramResponse,
} from './model/types';
