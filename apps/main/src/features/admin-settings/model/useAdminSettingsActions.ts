import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type Dispatch,
  type SetStateAction,
} from "react";
import { type User as SupabaseUser } from "@supabase/supabase-js";
import { toast } from "sonner";
import type { TablesInsert } from "@gridix/types/database";

import { supabase } from "@/shared/api/supabase";
import type { CompanySettings } from "./types";

const companySettingsSignature = (s: CompanySettings) =>
  JSON.stringify({
    company_name: s.company_name || "",
    tax_id: s.tax_id,
    address: s.address,
    phone: s.phone,
    email: s.email,
    bank_name: s.bank_name,
    iban: s.iban,
    currency: s.currency,
    vat_payer: s.vat_payer,
    website: s.website,
    industry: s.industry,
    description: s.description,
    logo_url: s.logo_url,
  });

type UseAdminSettingsActionsParams = {
  userProfile: SupabaseUser;
  t: (key: string, vars?: Record<string, unknown>) => string;
  companySettings: CompanySettings;
  setCompanySettings: Dispatch<SetStateAction<CompanySettings>>;
  getSystemDomain: () => string;
};

export const useAdminSettingsActions = ({
  userProfile,
  t,
  companySettings,
  setCompanySettings,
  getSystemDomain,
}: UseAdminSettingsActionsParams) => {
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [exportingBackup, setExportingBackup] = useState(false);
  const [resettingSettings, setResettingSettings] = useState(false);
  const [saving, setSaving] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const companySettingsRef = useRef(companySettings);
  const lastCommittedCompanySignatureRef = useRef<string | null>(null);
  const companyPersistInFlight = useRef(false);
  const profileSaveFnRef = useRef<(() => Promise<void>) | null>(null);
  const notificationSaveFnRef = useRef<(() => Promise<void>) | null>(null);

  useEffect(() => {
    companySettingsRef.current = companySettings;
  }, [companySettings]);

  // Sync committed snapshot when the row is loaded or refreshed from the server.
  useEffect(() => {
    if (!userProfile?.id) return;
    lastCommittedCompanySignatureRef.current =
      companySettingsSignature(companySettings);
  }, [userProfile?.id, companySettings.id, companySettings.updated_at]);

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

  const persistCompanySettingsIfDirty = useCallback(
    async (options?: { force?: boolean; silent?: boolean }) => {
      if (!userProfile?.id || companyPersistInFlight.current) return;

      const current = companySettingsRef.current;
      const nextSignature = companySettingsSignature(current);
      if (
        !options?.force &&
        nextSignature === lastCommittedCompanySignatureRef.current
      ) {
        return;
      }

      companyPersistInFlight.current = true;
      try {
        const companyData: TablesInsert<"company_settings"> = {
          user_id: userProfile.id,
          company_name: current.company_name || "",
          tax_id: current.tax_id,
          address: current.address,
          phone: current.phone,
          email: current.email,
          bank_name: current.bank_name,
          iban: current.iban,
          currency: current.currency,
          vat_payer: current.vat_payer,
          website: current.website,
          industry: current.industry,
          description: current.description,
          logo_url: current.logo_url,
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
          lastCommittedCompanySignatureRef.current = companySettingsSignature({
            ...(companyResult as CompanySettings),
            user_id: userProfile.id,
          });
        } else {
          lastCommittedCompanySignatureRef.current = nextSignature;
        }
      } catch (error) {
        console.error("Error saving company settings:", error);
        if (!options?.silent) {
          toast.error(t("adminSettings.errorSaving"));
        }
        throw error;
      } finally {
        companyPersistInFlight.current = false;
      }
    },
    [getSystemDomain, setCompanySettings, t, userProfile?.id],
  );

  const scheduleCompanyAutoSave = useCallback(() => {
    window.setTimeout(() => {
      void persistCompanySettingsIfDirty({ silent: true });
    }, 0);
  }, [persistCompanySettingsIfDirty]);

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
        company_name: companySettings.company_name || "",
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

      await persistCompanySettingsIfDirty({ force: true, silent: true });

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
    uploadingLogo,
    logoInputRef,
    exportingBackup,
    resettingSettings,
    saving,
    onProfileReady,
    onNotificationReady,
    handleLogoFileChange,
    handleExportBackup,
    handleResetSettings,
    handleSave,
    scheduleCompanyAutoSave,
  };
};
