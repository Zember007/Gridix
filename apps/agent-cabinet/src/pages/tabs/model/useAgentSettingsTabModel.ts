import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { ADMIN_THEME, getAdminThemeVariables } from "@gridix/utils";
import { useWorkspace } from "@gridix/utils/react";
import { toast } from "sonner";
import {
  useAgentContractSettings,
  useMySignedContracts,
} from "@/entities/agent-contract";
import {
  type UserProfileRow,
  useMyUserProfile,
} from "@/entities/agent-profile";
import { saveUserProfile } from "@/features/agent-profile-save";
import type { SettingsSectionValue } from "@/features/agent-settings/model/types";
import { useAuth } from "@/shared/lib/auth";

export type SettingsTranslateFn = (key: string) => string;

export interface AgentSettingsTabModel {
  activeWorkspaceId: string | null;
  contractData: Awaited<ReturnType<typeof useAgentContractSettings>>["data"];
  contractError: Error | null;
  contractLoading: boolean;
  contractsQuery: ReturnType<typeof useMySignedContracts>;
  handleSaveAll: () => Promise<void>;
  handleSaveProfile: () => Promise<void>;
  myProfileQuery: ReturnType<typeof useMyUserProfile>;
  onNotificationReady: (api: {
    saveNotificationPreferences: () => Promise<void>;
  }) => void;
  profileForm: Partial<UserProfileRow>;
  profileLoading: boolean;
  refreshContracts: () => void;
  refreshProfile: () => Promise<void>;
  saving: boolean;
  setProfileForm: (next: Partial<UserProfileRow>) => void;
  setSection: (next: SettingsSectionValue) => void;
  section: SettingsSectionValue;
  themeVariables: CSSProperties;
  userEmail: string;
  userId: string | null;
}

export function useAgentSettingsTabModel(
  t: SettingsTranslateFn,
): AgentSettingsTabModel {
  const { user } = useAuth();
  const { activeWorkspaceId } = useWorkspace();

  const [section, setSection] = useState<SettingsSectionValue>("company");
  const [saving, setSaving] = useState(false);
  const notificationSaveFnRef = useRef<(() => Promise<void>) | null>(null);

  const onNotificationReady = useCallback(
    (api: { saveNotificationPreferences: () => Promise<void> }) => {
      notificationSaveFnRef.current = api.saveNotificationPreferences;
    },
    [],
  );

  const {
    data: contractData,
    isLoading: contractLoading,
    error: rawContractError,
  } = useAgentContractSettings(activeWorkspaceId ?? undefined);

  const myProfileQuery = useMyUserProfile(user?.id);
  const [profileForm, setProfileForm] = useState<Partial<UserProfileRow>>({});

  useEffect(() => {
    if (!myProfileQuery.data) return;
    setProfileForm(myProfileQuery.data);
  }, [myProfileQuery.data]);

  const contractsQuery = useMySignedContracts(activeWorkspaceId ?? undefined);

  const persistUserProfile = useCallback(async () => {
    if (!user?.id) return;
    await saveUserProfile(user.id, profileForm);
    await myProfileQuery.refetch();
  }, [myProfileQuery, profileForm, user?.id]);

  const handleSaveProfile = useCallback(async () => {
    try {
      await persistUserProfile();
      toast.success(t("common.settings.profileSaved"));
    } catch (error) {
      console.error("Failed to save profile", error);
      toast.error(t("common.settings.profileSaveError"));
    }
  }, [persistUserProfile, t]);

  const handleSaveAll = useCallback(async () => {
    setSaving(true);
    try {
      await persistUserProfile();
      if (notificationSaveFnRef.current) {
        await notificationSaveFnRef.current();
      }
      toast.success(t("common.settings.profileSaved"));
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error(t("common.settings.profileSaveError"));
    } finally {
      setSaving(false);
    }
  }, [persistUserProfile, t]);

  const themeVariables = useMemo(
    () => getAdminThemeVariables(ADMIN_THEME) as CSSProperties,
    [],
  );

  return {
    activeWorkspaceId,
    contractData,
    contractError: rawContractError instanceof Error ? rawContractError : null,
    contractLoading,
    contractsQuery,
    handleSaveAll,
    handleSaveProfile,
    myProfileQuery,
    onNotificationReady,
    profileForm,
    profileLoading: myProfileQuery.isLoading,
    refreshContracts: () => void contractsQuery.refetch(),
    refreshProfile: async () => {
      await myProfileQuery.refetch();
    },
    saving,
    section,
    setProfileForm,
    setSection,
    themeVariables,
    userEmail: user?.email ?? "",
    userId: user?.id ?? null,
  };
}
