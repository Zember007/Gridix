import {
  useRef,
  useState,
  useEffect,
  useCallback,
  type ChangeEvent,
} from "react";
import { toast } from "sonner";
import { useLanguage } from "@gridix/utils/react";
import { ADMIN_THEME, getAdminThemeVariables } from "@gridix/utils/lib";
import { type User as SupabaseUser } from "@supabase/supabase-js";

import { supabase } from "@/shared/api/supabase";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import type { ManagerRole } from "@/hooks/useUserRole";
import type { Tables, TablesInsert } from "@gridix/types/database";

type AdminSettingsForm = {
  user_id: string;
  company_name: string;
  full_name: string;
  phone: string;
};

type CompanySettings = Tables<"company_settings">;

export type TabValue =
  | "company"
  | "billing"
  | "account"
  | "contacts"
  | "notifications"
  | "templates"
  | "data";

type AdminSettingsControllerProps = {
  userProfile: SupabaseUser;
  loading: boolean;
  developerId?: string;
  isManager?: boolean;
  managerData?: ManagerRole[];
};

export const useAdminSettingsController = ({
  userProfile,
}: AdminSettingsControllerProps) => {
  const { t } = useLanguage();
  const { isManagerMode } = useWorkspace();

  const [tab, setTab] = useState<TabValue>("company");

  const [settings, setSettings] = useState<AdminSettingsForm>({
    user_id: userProfile?.id || "",
    company_name: "",
    full_name: "",
    phone: "",
  });

  const [companySettings, setCompanySettings] = useState<CompanySettings>({
    id: "",
    user_id: userProfile?.id || "",
    company_name: "",
    tax_id: "",
    address: null,
    phone: null,
    email: null,
    bank_name: null,
    iban: null,
    currency: "GEL",
    vat_payer: false,
    website: null,
    industry: null,
    description: null,
    logo_url: null,
    system_domain: null,
    created_at: null,
    updated_at: null,
  });

  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [exportingBackup, setExportingBackup] = useState(false);
  const [resettingSettings, setResettingSettings] = useState(false);
  const [saving, setSaving] = useState(false);

  const profileSaveFnRef = useRef<(() => Promise<void>) | null>(null);
  const notificationSaveFnRef = useRef<(() => Promise<void>) | null>(null);

  const onProfileReady = useCallback(
    (api: { saveProfile: () => Promise<void> }) => {
      profileSaveFnRef.current = api.saveProfile;
    },
    [],
  );

  const onNotificationReady = useCallback(
    (api: { saveNotificationPreferences: () => Promise<void> }) => {
      notificationSaveFnRef.current = api.saveNotificationPreferences;
    },
    [],
  );

  useEffect(() => {
    const themeVariables = getAdminThemeVariables(ADMIN_THEME);
    Object.entries(themeVariables).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });
  }, []);

  useEffect(() => {
    if (!userProfile) return;

    const loadProfileData = async () => {
      try {
        const { data, error } = await supabase
          .from("user_profiles")
          .select("company_name, full_name, phone")
          .eq("id", userProfile.id)
          .single();

        if (error) {
          console.error("Error loading profile:", error);
          setSettings({
            user_id: userProfile.id,
            company_name: userProfile.user_metadata.company_name || "",
            full_name: userProfile.user_metadata.full_name || "",
            phone: userProfile.user_metadata.phone || "",
          });
          return;
        }

        setSettings({
          user_id: userProfile.id,
          company_name: data?.company_name || "",
          full_name: data?.full_name || "",
          phone: data?.phone || "",
        });
      } catch (error) {
        console.error("Error in loadProfileData:", error);
        setSettings({
          user_id: userProfile.id,
          company_name: userProfile.user_metadata.company_name || "",
          full_name: userProfile.user_metadata.full_name || "",
          phone: userProfile.user_metadata.phone || "",
        });
      }
    };

    const loadCompanySettings = async () => {
      try {
        const { data, error } = await supabase
          .from("company_settings")
          .select("*")
          .eq("user_id", userProfile.id)
          .single();

        if (error) {
          console.error("Error loading company settings:", error);
          setCompanySettings((prev) => ({
            ...prev,
            user_id: userProfile.id,
          }));
          return;
        }

        setCompanySettings((prev) => ({
          ...prev,
          ...(data ?? {}),
          user_id: userProfile.id,
        }));
      } catch (error) {
        console.error("Error in loadCompanySettings:", error);
        setCompanySettings((prev) => ({
          ...prev,
          user_id: userProfile.id,
        }));
      }
    };

    void loadProfileData();
    void loadCompanySettings();
  }, [userProfile]);

  const generateDomainSlug = (name: string) => {
    if (!name) return "your-company";
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const getSystemDomain = () => {
    return (
      companySettings.system_domain ||
      `${generateDomainSlug(settings.company_name)}.gridix.live`
    );
  };

  const handleLogoFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userProfile?.id) return;

    setUploadingLogo(true);
    try {
      const safeName = file.name
        .trim()
        .replace(/\s+/g, "_")
        .replace(/[^a-zA-Z0-9._-]/g, "_")
        .replace(/_+/g, "_");

      const bucket = "project-images";
      const path = `company-logos/${userProfile.id}/${Date.now()}_${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          upsert: true,
          contentType: file.type || "application/octet-stream",
        });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(path);
      const publicUrl = urlData?.publicUrl || null;

      const nowIso = new Date().toISOString();
      const companyData: TablesInsert<"company_settings"> = {
        user_id: userProfile.id,
        company_name:
          companySettings.company_name || settings.company_name || "",
        tax_id: companySettings.tax_id ?? null,
        address: companySettings.address ?? null,
        phone: companySettings.phone ?? null,
        email: companySettings.email ?? null,
        bank_name: companySettings.bank_name ?? null,
        iban: companySettings.iban ?? null,
        currency: companySettings.currency ?? "GEL",
        vat_payer: companySettings.vat_payer ?? false,
        website: companySettings.website ?? null,
        industry: companySettings.industry ?? null,
        description: companySettings.description ?? null,
        logo_url: publicUrl,
        system_domain: getSystemDomain(),
        updated_at: nowIso,
      };

      const { data: saved, error: saveError } = await supabase
        .from("company_settings")
        .upsert(companyData, { onConflict: "user_id" })
        .select()
        .single();

      if (saveError) throw saveError;

      setCompanySettings((prev) => ({
        ...prev,
        ...(saved ?? {}),
        user_id: userProfile.id,
      }));
      toast.success(t("adminSettings.logoUploaded"));
    } catch (error) {
      console.error("Failed to upload logo", error);
      toast.error(t("adminSettings.logoUploadError"));
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  };

  const handleCompanyInputChange = (
    field: keyof CompanySettings,
    value: string | boolean | null,
  ) => {
    setCompanySettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleInputChange = (field: keyof AdminSettingsForm, value: string) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleExportBackup = async () => {
    setExportingBackup(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "developer-settings",
        { body: { action: "export_backup" } },
      );
      if (error) throw error;

      const content = JSON.stringify(data ?? {}, null, 2);
      const blob = new Blob([content], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `gridix_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(t("adminSettings.backupDownloaded"));
    } catch (error) {
      console.error("Failed to export backup", error);
      toast.error(t("adminSettings.backupError"));
    } finally {
      setExportingBackup(false);
    }
  };

  const handleResetSettings = async () => {
    if (!confirm(t("adminSettings.resetConfirm"))) return;

    setResettingSettings(true);
    try {
      const { error } = await supabase.functions.invoke("developer-settings", {
        body: { action: "reset_settings" },
      });
      if (error) throw error;

      try {
        localStorage.removeItem("gridix_lang");
      } catch {
        // ignore
      }

      toast.success(t("adminSettings.resetSuccess"));
      window.location.reload();
    } catch (error) {
      console.error("Failed to reset settings", error);
      toast.error(t("adminSettings.resetError"));
    } finally {
      setResettingSettings(false);
    }
  };

  const handleSave = async () => {
    if (!userProfile) {
      toast.error(t("adminSettings.authRequired"));
      return;
    }

    setSaving(true);
    try {
      if (profileSaveFnRef.current) {
        await profileSaveFnRef.current();
      }

      const companyData: TablesInsert<"company_settings"> = {
        user_id: userProfile.id,
        company_name: companySettings.company_name,
        tax_id: companySettings.tax_id,
        address: companySettings.address,
        phone: companySettings.phone,
        email: companySettings.email,
        bank_name: companySettings.bank_name,
        iban: companySettings.iban,
        currency: companySettings.currency,
        vat_payer: companySettings.vat_payer,
        website: companySettings.website,
        industry: companySettings.industry,
        description: companySettings.description,
        logo_url: companySettings.logo_url,
        system_domain: getSystemDomain(),
        updated_at: new Date().toISOString(),
      };

      const { data: companyResult, error: companyError } = await supabase
        .from("company_settings")
        .upsert(companyData, { onConflict: "user_id" })
        .select()
        .single();

      if (companyError) {
        console.error("Supabase company settings error:", companyError);
        throw companyError;
      }

      if (companyResult) {
        setCompanySettings((prev) => ({
          ...prev,
          ...(companyResult as CompanySettings),
          user_id: userProfile.id,
        }));
      }

      if (notificationSaveFnRef.current) {
        await notificationSaveFnRef.current();
      }

      toast.success(t("adminSettings.settingsSaved"));
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error(t("adminSettings.errorSaving"));
    } finally {
      setSaving(false);
    }
  };

  return {
    t,
    isManagerMode,
    tab,
    setTab,
    settings,
    companySettings,
    uploadingLogo,
    logoInputRef,
    exportingBackup,
    resettingSettings,
    saving,
    onProfileReady,
    onNotificationReady,
    handleInputChange,
    handleCompanyInputChange,
    getSystemDomain,
    handleLogoFileChange,
    handleExportBackup,
    handleResetSettings,
    handleSave,
  };
};
