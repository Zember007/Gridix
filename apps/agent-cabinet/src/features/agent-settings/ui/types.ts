import type {
  AgentApplicationSettings,
  SettingsSectionValue,
  SignedContract,
  UserProfileRow,
} from "../model/types";

export type SettingsTranslateFn = (key: string) => string;

export interface AgentSettingsSectionsSwitcherProps {
  activeSection: SettingsSectionValue;
  onSectionChange: (value: SettingsSectionValue) => void;
  t: SettingsTranslateFn;
}

export interface AgentUserProfileSectionProps {
  loading: boolean;
  value: Partial<UserProfileRow>;
  onChange: (next: Partial<UserProfileRow>) => void;
  onSave: () => Promise<void>;
  t: SettingsTranslateFn;
}

export interface AgentSignatureSectionProps {
  userId: string | null;
  existingSignaturePath: string | null;
  existingMethod: string | null;
  onUpdated: () => Promise<void>;
  t: SettingsTranslateFn;
}

export interface AgentSignedContractsSectionProps {
  applicationId: string | null;
  loading: boolean;
  error: Error | null;
  contracts: SignedContract[];
  onRefresh: () => void;
  t: SettingsTranslateFn;
}

export interface AgentContractCardProps {
  data: AgentApplicationSettings | null;
  loading: boolean;
  error: Error | null;
  t: SettingsTranslateFn;
}
