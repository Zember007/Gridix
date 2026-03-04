import type { UserProfileRow } from "@/entities/agent-profile";
import type { SettingsSectionValue } from "../model/types";

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
