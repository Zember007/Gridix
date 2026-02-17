import { useRef, useState, useEffect, type ChangeEvent } from "react";
import { Button } from "@gridix/ui";
import { Input } from "@gridix/ui";
import { Label } from "@gridix/ui";
import { Textarea } from "@gridix/ui";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@gridix/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@gridix/ui";
import { Checkbox } from "@gridix/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@gridix/ui";
import {
  Save,
  User,
  Building,
  CreditCard,
  KeyRound,
  Bell,
  MessageSquare,
  Database,
} from "lucide-react";
import { ADMIN_THEME, getAdminThemeVariables } from "@gridix/utils/lib";
import { toast } from "sonner";
import { supabase } from "@gridix/utils/api";
import { LanguageToggle } from "@gridix/ui";
import { useLanguage } from "@gridix/utils/react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { User as SupabaseUser } from "@supabase/supabase-js";
import ManagerAccountsManager from "@/components/admin/ManagerAccountsManager";
import { ManagerRole } from "@/hooks/useUserRole";
import { Tables, TablesInsert } from "@gridix/types/database";
import { Spinner } from "@/shared/ui/Spinner";
import { AdminSettingsCompanyTab } from "@/components/admin/settings/AdminSettingsCompanyTab";
import { AdminSettingsDataTab } from "@/components/admin/settings/AdminSettingsDataTab";
import { AdminSettingsNotificationsTab } from "@/components/admin/settings/AdminSettingsNotificationsTab";
import { AdminSettingsTemplatesTab } from "@/components/admin/settings/AdminSettingsTemplatesTab";

interface AdminSettings {
  id?: string;
  user_id: string;
  company_name: string;
  full_name: string;
  phone: string;
  created_at?: string;
  updated_at?: string;
}

type CompanySettings = Tables<"company_settings">;
type NotificationPreferencesRow = Tables<"user_notification_preferences">;
type MessageTemplateRow = Tables<"user_message_templates">;

type NotificationPreferencesForm = Omit<
  NotificationPreferencesRow,
  "created_at" | "updated_at"
>;

const TELEGRAM_BOT_USERNAME = "gridix_bot";
const SUPPORTED_LOCALES = ["en", "ru", "ka", "he", "ar"] as const;
type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

type TabValue =
  | "company"
  | "billing"
  | "account"
  | "contacts"
  | "notifications"
  | "templates"
  | "data";

interface AdminSettingsProps {
  userProfile: SupabaseUser;
  loading: boolean;
  developerId?: string;
  isManager?: boolean;
  managerData?: ManagerRole[];
}

const AdminSettings = ({
  userProfile,
  loading,
  developerId,
  managerData,
}: AdminSettingsProps) => {
  const { t } = useLanguage();
  const { isManagerMode } = useWorkspace();

  const [tab, setTab] = useState<TabValue>("company");

  const [settings, setSettings] = useState<AdminSettings>({
    user_id: userProfile?.id || "",
    company_name: "",
    full_name: "",
    phone: "",
  });

  const [preferredLocale, setPreferredLocale] = useState<SupportedLocale>("en");

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

  const [notificationPreferences, setNotificationPreferences] =
    useState<NotificationPreferencesForm>({
      user_id: userProfile?.id || "",
      channel_email: true,
      channel_push: false,
      channel_telegram: false,
      telegram_username: null,
      telegram_verified: false,
      telegram_last_checked_at: null,
      telegram_last_error: null,
      notify_new_lead: true,
      notify_task_due: true,
      notify_payment_received: true,
      notify_system_update: false,
    });

  const [loadingNotificationPreferences, setLoadingNotificationPreferences] =
    useState(false);

  const [messageTemplates, setMessageTemplates] = useState<
    MessageTemplateRow[]
  >([]);
  const [loadingMessageTemplates, setLoadingMessageTemplates] = useState(false);
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(
    null,
  );
  const [templateTitle, setTemplateTitle] = useState("");
  const [templateContent, setTemplateContent] = useState("");

  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [exportingBackup, setExportingBackup] = useState(false);
  const [resettingSettings, setResettingSettings] = useState(false);
  const [saving, setSaving] = useState(false);

  const [newEmail, setNewEmail] = useState("");
  const [updatingEmail, setUpdatingEmail] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Apply theme variables
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
          .select("company_name, full_name, phone, preferred_locale")
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
          setPreferredLocale("en");
          return;
        }

        setSettings({
          user_id: userProfile.id,
          company_name: data?.company_name || "",
          full_name: data?.full_name || "",
          phone: data?.phone || "",
        });

        const rawLocale = String((data as any)?.preferred_locale ?? "")
          .trim()
          .toLowerCase();

        if ((SUPPORTED_LOCALES as readonly string[]).includes(rawLocale)) {
          setPreferredLocale(rawLocale as SupportedLocale);
        } else {
          setPreferredLocale("en");
        }
      } catch (error) {
        console.error("Error in loadProfileData:", error);
        setSettings({
          user_id: userProfile.id,
          company_name: userProfile.user_metadata.company_name || "",
          full_name: userProfile.user_metadata.full_name || "",
          phone: userProfile.user_metadata.phone || "",
        });
        setPreferredLocale("en");
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

    const loadNotificationPrefs = async () => {
      setLoadingNotificationPreferences(true);
      try {
        const { data, error } = await supabase
          .from("user_notification_preferences")
          .select("*")
          .eq("user_id", userProfile.id)
          .maybeSingle();

        if (error && error.code !== "PGRST116") {
          console.error("Error loading notification preferences:", error);
        }

        if (!data) {
          setNotificationPreferences((prev) => ({
            ...prev,
            user_id: userProfile.id,
          }));
          return;
        }

        setNotificationPreferences({
          user_id: userProfile.id,
          channel_email: data.channel_email,
          channel_push: data.channel_push,
          channel_telegram: data.channel_telegram,
          telegram_username: data.telegram_username,
          telegram_verified: data.telegram_verified,
          telegram_last_checked_at: data.telegram_last_checked_at,
          telegram_last_error: data.telegram_last_error,
          notify_new_lead: data.notify_new_lead,
          notify_task_due: data.notify_task_due,
          notify_payment_received: data.notify_payment_received,
          notify_system_update: data.notify_system_update,
        });
      } catch (e) {
        console.error("Error in loadNotificationPrefs:", e);
      } finally {
        setLoadingNotificationPreferences(false);
      }
    };

    const loadTemplates = async () => {
      setLoadingMessageTemplates(true);
      try {
        const { data, error } = await supabase
          .from("user_message_templates")
          .select("*")
          .eq("user_id", userProfile.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setMessageTemplates(data ?? []);
      } catch (e) {
        console.error("Error loading message templates:", e);
        setMessageTemplates([]);
      } finally {
        setLoadingMessageTemplates(false);
      }
    };

    loadProfileData();
    loadCompanySettings();
    loadNotificationPrefs();
    loadTemplates();
  }, [userProfile]);

  const handleUpdateEmail = async () => {
    if (!newEmail) {
      toast.error(t("adminSettings.errorUpdatingEmail"));
      return;
    }

    setUpdatingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });

      if (error) {
        console.error("Error updating email:", error);
        if (error.message?.includes("same") || error.code === "same_email") {
          toast.error(t("adminSettings.sameEmail"));
        } else if (
          error.message?.includes("already") ||
          error.code === "email_exists"
        ) {
          toast.error(t("adminSettings.emailExists"));
        } else {
          toast.error(t("adminSettings.errorUpdatingEmail"));
        }
      } else {
        toast.success(t("adminSettings.emailUpdated"));
        setNewEmail("");
      }
    } catch (error) {
      console.error("Error updating email:", error);
      toast.error(t("adminSettings.errorUpdatingEmail"));
    } finally {
      setUpdatingEmail(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error(t("adminSettings.errorUpdatingPassword"));
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t("adminSettings.passwordsDoNotMatch"));
      return;
    }

    setUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        console.error("Error updating password:", error);
        if (error.code === "same_password") {
          toast.error(t("adminSettings.samePassword"));
        } else {
          toast.error(t("adminSettings.errorUpdatingPassword"));
        }
      } else {
        toast.success(t("adminSettings.passwordUpdated"));
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (error) {
      console.error("Error updating password:", error);
      toast.error(t("adminSettings.errorUpdatingPassword"));
    } finally {
      setUpdatingPassword(false);
    }
  };

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
    } catch (err) {
      console.error("Failed to upload logo", err);
      toast.error(t("adminSettings.logoUploadError"));
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  };

  const handleNotificationPreferenceChange = (
    field: keyof Omit<NotificationPreferencesForm, "user_id">,
    value: boolean | string | null,
  ) => {
    setNotificationPreferences((prev) => ({
      ...prev,
      [field]: value,
    })) as unknown as void;
  };

  const handleTelegramUsernameChange = (value: string) => {
    const next = value.startsWith("@") ? value : `@${value.replace(/^@+/, "")}`;
    setNotificationPreferences((prev) => ({
      ...prev,
      telegram_username: next === "@" ? null : next,
    }));
  };

  const verifyTelegramOnBlur = async () => {
    const username = notificationPreferences.telegram_username?.trim() ?? "";
    if (!notificationPreferences.channel_telegram || !username) return;

    const normalized = username.startsWith("@") ? username : `@${username}`;
    if (normalized !== username) {
      setNotificationPreferences((prev) => ({
        ...prev,
        telegram_username: normalized,
      }));
    }

    try {
      const { data, error } = await supabase.functions.invoke(
        "developer-settings",
        {
          body: { action: "telegram_verify_username", username: normalized },
        },
      );
      if (error) throw error;

      const ok = !!(data as { ok?: unknown })?.ok;
      const nowIso = new Date().toISOString();

      setNotificationPreferences((prev) => ({
        ...prev,
        telegram_verified: ok,
        telegram_last_checked_at: nowIso,
        telegram_last_error: ok ? null : JSON.stringify(data ?? null),
      }));

      if (!ok) {
        toast.error(t("adminSettings.telegramNeedsStart"), {
          description: t("adminSettings.telegramNeedsStartDesc", {
            bot: `@${TELEGRAM_BOT_USERNAME}`,
          }),
        });
      }
    } catch (e) {
      console.error("Failed to verify telegram username", e);
      setNotificationPreferences((prev) => ({
        ...prev,
        telegram_verified: false,
        telegram_last_checked_at: new Date().toISOString(),
        telegram_last_error: e instanceof Error ? e.message : "unknown",
      }));
      toast.error(t("adminSettings.telegramVerifyError"));
    }
  };

  const startCreateTemplate = () => {
    setIsCreatingTemplate(true);
    setEditingTemplateId(null);
    setTemplateTitle("");
    setTemplateContent("");
  };

  const startEditTemplate = (tpl: MessageTemplateRow) => {
    setIsCreatingTemplate(false);
    setEditingTemplateId(tpl.id);
    setTemplateTitle(tpl.title);
    setTemplateContent(tpl.content);
  };

  const cancelTemplateEditor = () => {
    setIsCreatingTemplate(false);
    setEditingTemplateId(null);
    setTemplateTitle("");
    setTemplateContent("");
  };

  const saveTemplate = async () => {
    if (!userProfile?.id) return;
    if (!templateTitle.trim() || !templateContent.trim()) return;

    try {
      const nowIso = new Date().toISOString();

      if (editingTemplateId) {
        const { error } = await supabase
          .from("user_message_templates")
          .update({
            title: templateTitle.trim(),
            content: templateContent,
            variables: ["name"],
            updated_at: nowIso,
          })
          .eq("id", editingTemplateId)
          .eq("user_id", userProfile.id);

        if (error) throw error;
        toast.success(t("adminSettings.templateUpdated"));
      } else {
        const { error } = await supabase.from("user_message_templates").insert({
          user_id: userProfile.id,
          title: templateTitle.trim(),
          content: templateContent,
          variables: ["name"],
          updated_at: nowIso,
        });

        if (error) throw error;
        toast.success(t("adminSettings.templateCreated"));
      }

      const { data, error: loadErr } = await supabase
        .from("user_message_templates")
        .select("*")
        .eq("user_id", userProfile.id)
        .order("created_at", { ascending: false });
      if (loadErr) throw loadErr;

      setMessageTemplates(data ?? []);
      cancelTemplateEditor();
    } catch (e) {
      console.error("Failed to save template", e);
      toast.error(t("adminSettings.templateSaveError"));
    }
  };

  const deleteTemplate = async (tpl: MessageTemplateRow) => {
    if (!userProfile?.id) return;
    if (!confirm(t("adminSettings.templateDeleteConfirm"))) return;

    try {
      const { error } = await supabase
        .from("user_message_templates")
        .delete()
        .eq("id", tpl.id)
        .eq("user_id", userProfile.id);

      if (error) throw error;

      setMessageTemplates((prev) => prev.filter((x) => x.id !== tpl.id));
      toast.success(t("adminSettings.templateDeleted"));

      if (editingTemplateId === tpl.id) cancelTemplateEditor();
    } catch (e) {
      console.error("Failed to delete template", e);
      toast.error(t("adminSettings.templateDeleteError"));
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
      link.download = `gridix_backup_${new Date()
        .toISOString()
        .slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(t("adminSettings.backupDownloaded"));
    } catch (e) {
      console.error("Failed to export backup", e);
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
    } catch (e) {
      console.error("Failed to reset settings", e);
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
      const profileData = {
        company_name: settings.company_name,
        full_name: settings.full_name,
        phone: settings.phone,
        preferred_locale: preferredLocale,
        updated_at: new Date().toISOString(),
      };

      const { data: profileResult, error: profileError } = await supabase
        .from("user_profiles")
        .update(profileData)
        .eq("id", userProfile.id)
        .select();

      if (profileError) {
        console.error("Supabase profile error:", profileError);
        throw profileError;
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

      const notifData = {
        ...notificationPreferences,
        user_id: userProfile.id,
        updated_at: new Date().toISOString(),
      };

      const { data: notifResult, error: notifError } = await supabase
        .from("user_notification_preferences")
        .upsert(notifData, { onConflict: "user_id" })
        .select()
        .single();

      if (notifError) {
        console.error("Supabase notification preferences error:", notifError);
        throw notifError;
      }

      if (profileResult && profileResult.length > 0) {
        setSettings((prev) => ({
          ...prev,
          company_name: profileResult[0]?.company_name || "",
          full_name: profileResult[0]?.full_name || "",
          phone: profileResult[0]?.phone || "",
        }));
      }

      if (companyResult) {
        setCompanySettings((prev) => ({
          ...prev,
          ...(companyResult as CompanySettings),
          user_id: userProfile.id,
        }));
      }

      if (notifResult) {
        setNotificationPreferences({
          user_id: userProfile.id,
          channel_email: notifResult.channel_email,
          channel_push: notifResult.channel_push,
          channel_telegram: notifResult.channel_telegram,
          telegram_username: notifResult.telegram_username,
          telegram_verified: notifResult.telegram_verified,
          telegram_last_checked_at: notifResult.telegram_last_checked_at,
          telegram_last_error: notifResult.telegram_last_error,
          notify_new_lead: notifResult.notify_new_lead,
          notify_task_due: notifResult.notify_task_due,
          notify_payment_received: notifResult.notify_payment_received,
          notify_system_update: notifResult.notify_system_update,
        });
      }

      toast.success(t("adminSettings.settingsSaved"));
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error(t("adminSettings.errorSaving"));
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof AdminSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleCompanyInputChange = (
    field: keyof CompanySettings,
    value: string | boolean | null,
  ) => {
    setCompanySettings((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="md" style={{ borderColor: ADMIN_THEME.primary }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("adminSettings.title")}</h1>
          <p className="text-muted-foreground">
            {t("adminSettings.description")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <Button
            onClick={handleSave}
            disabled={saving}
            style={{
              backgroundColor: ADMIN_THEME.primary,
              color: ADMIN_THEME.textOnPrimary,
            }}
            onMouseEnter={(e) => {
              if (!saving)
                e.currentTarget.style.backgroundColor =
                  ADMIN_THEME.primaryHover;
            }}
            onMouseLeave={(e) => {
              if (!saving)
                e.currentTarget.style.backgroundColor = ADMIN_THEME.primary;
            }}
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? t("adminSettings.saving") : t("adminSettings.save")}
          </Button>
        </div>
      </div>

      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as TabValue)}
        className="space-y-6"
      >
        <TabsList className="mb-5">
          {/* Mobile: select */}
          <div className="w-full sm:hidden">
            <Select value={tab} onValueChange={(v) => setTab(v as TabValue)}>
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder={t("adminSettings.company")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="company">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    {t("adminSettings.company")}
                  </div>
                </SelectItem>

                <SelectItem value="billing">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    {t("adminSettings.billing")}
                  </div>
                </SelectItem>

                <SelectItem value="account">
                  <div className="flex items-center gap-2">
                    <KeyRound className="h-4 w-4" />
                    {t("adminSettings.account")}
                  </div>
                </SelectItem>

                <SelectItem value="contacts">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {t("adminSettings.contacts")}
                  </div>
                </SelectItem>

                <SelectItem value="notifications">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    {t("adminSettings.notifications")}
                  </div>
                </SelectItem>

                <SelectItem value="templates">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    {t("adminSettings.templates")}
                  </div>
                </SelectItem>

                <SelectItem value="data">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    {t("adminSettings.data")}
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Desktop: tabs */}
          <div className="hidden flex-wrap gap-3 sm:flex">
            <TabsTrigger value="company" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              {t("adminSettings.company")}
            </TabsTrigger>

            <TabsTrigger value="billing" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              {t("adminSettings.billing")}
            </TabsTrigger>

            <TabsTrigger value="account" className="flex items-center gap-2">
              <KeyRound className="h-4 w-4" />
              {t("adminSettings.account")}
            </TabsTrigger>

            <TabsTrigger value="contacts" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              {t("adminSettings.contacts")}
            </TabsTrigger>

            <TabsTrigger
              value="notifications"
              className="flex items-center gap-2"
            >
              <Bell className="h-4 w-4" />
              {t("adminSettings.notifications")}
            </TabsTrigger>

            <TabsTrigger value="templates" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              {t("adminSettings.templates")}
            </TabsTrigger>

            <TabsTrigger value="data" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              {t("adminSettings.data")}
            </TabsTrigger>
          </div>
        </TabsList>

        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle>{t("adminSettings.companyInfo")}</CardTitle>
              <CardDescription>
                {t("adminSettings.companyInfoDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <AdminSettingsCompanyTab
                settingsCompanyName={settings.company_name}
                onBrandNameChange={(value) =>
                  handleInputChange("company_name", value)
                }
                companySettings={companySettings}
                onCompanyFieldChange={handleCompanyInputChange}
                systemDomain={getSystemDomain()}
                logoInputRef={logoInputRef}
                uploadingLogo={uploadingLogo}
                onLogoFileChange={handleLogoFileChange}
                t={t}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle>{t("adminSettings.billingInfo")}</CardTitle>
              <CardDescription>
                {t("adminSettings.billingInfoDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="company_name_billing">
                    {t("adminSettings.companyName")}
                  </Label>
                  <Input
                    id="company_name_billing"
                    value={companySettings.company_name}
                    onChange={(e) =>
                      handleCompanyInputChange("company_name", e.target.value)
                    }
                    placeholder={t("adminSettings.companyNamePlaceholder")}
                  />
                </div>

                <div>
                  <Label htmlFor="tax_id">{t("adminSettings.taxId")}</Label>
                  <Input
                    id="tax_id"
                    value={companySettings.tax_id || ""}
                    onChange={(e) =>
                      handleCompanyInputChange("tax_id", e.target.value || null)
                    }
                    placeholder={t("adminSettings.taxIdPlaceholder")}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address">
                  {t("adminSettings.companyAddress")}
                </Label>
                <Textarea
                  id="address"
                  value={companySettings.address || ""}
                  onChange={(e) =>
                    handleCompanyInputChange("address", e.target.value || null)
                  }
                  placeholder={t("adminSettings.companyAddressPlaceholder")}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="phone">{t("adminSettings.phone")}</Label>
                  <Input
                    id="phone"
                    value={companySettings.phone || ""}
                    onChange={(e) =>
                      handleCompanyInputChange("phone", e.target.value || null)
                    }
                    placeholder={t("adminSettings.phonePlaceholder")}
                  />
                </div>

                <div>
                  <Label htmlFor="email">{t("adminSettings.email")}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={companySettings.email || ""}
                    onChange={(e) =>
                      handleCompanyInputChange("email", e.target.value || null)
                    }
                    placeholder={t("adminSettings.emailPlaceholder")}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="bank_name">
                    {t("adminSettings.bankName")}
                  </Label>
                  <Input
                    id="bank_name"
                    value={companySettings.bank_name || ""}
                    onChange={(e) =>
                      handleCompanyInputChange(
                        "bank_name",
                        e.target.value || null,
                      )
                    }
                    placeholder={t("adminSettings.bankNamePlaceholder")}
                  />
                </div>

                <div>
                  <Label htmlFor="iban">{t("adminSettings.iban")}</Label>
                  <Input
                    id="iban"
                    value={companySettings.iban || ""}
                    onChange={(e) =>
                      handleCompanyInputChange("iban", e.target.value || null)
                    }
                    placeholder={t("adminSettings.ibanPlaceholder")}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="currency">
                    {t("adminSettings.currency")}
                  </Label>
                  <Select
                    value={companySettings.currency || "GEL"}
                    onValueChange={(value) =>
                      handleCompanyInputChange("currency", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t("adminSettings.currencyPlaceholder")}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GEL">GEL (Georgian Lari)</SelectItem>
                      <SelectItem value="USD">USD (US Dollar)</SelectItem>
                      <SelectItem value="EUR">EUR (Euro)</SelectItem>
                      <SelectItem value="RUB">RUB (Russian Ruble)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2 pt-6">
                  <Checkbox
                    id="vat_payer"
                    checked={companySettings.vat_payer || false}
                    onCheckedChange={(checked) =>
                      handleCompanyInputChange("vat_payer", checked as boolean)
                    }
                  />
                  <Label htmlFor="vat_payer">
                    {t("adminSettings.vatPayer")}
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("adminSettings.profileInfo")}</CardTitle>
                <CardDescription>
                  {t("adminSettings.profileInfoDesc")}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="full_name">
                      {t("adminSettings.fullName")}
                    </Label>
                    <Input
                      id="full_name"
                      value={settings.full_name}
                      onChange={(e) =>
                        handleInputChange("full_name", e.target.value)
                      }
                      placeholder={t("adminSettings.fullNamePlaceholder")}
                    />
                  </div>

                  <div>
                    <Label htmlFor="profile_phone">
                      {t("adminSettings.phone")}
                    </Label>
                    <Input
                      id="profile_phone"
                      value={settings.phone}
                      onChange={(e) =>
                        handleInputChange("phone", e.target.value)
                      }
                      placeholder={t("adminSettings.phonePlaceholder")}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="preferred_locale">Language</Label>
                    <Select
                      value={preferredLocale}
                      onValueChange={(v) =>
                        setPreferredLocale(v as SupportedLocale)
                      }
                    >
                      <SelectTrigger id="preferred_locale">
                        <SelectValue placeholder="en" />
                      </SelectTrigger>
                      <SelectContent>
                        {SUPPORTED_LOCALES.map((loc) => (
                          <SelectItem key={loc} value={loc}>
                            {loc.toUpperCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="text-xs text-muted-foreground">
                      Used for emails and default UI language.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("adminSettings.changeEmail")}</CardTitle>
                <CardDescription>
                  {t("adminSettings.accountInfoDesc")}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="current_email">
                    {t("adminSettings.currentEmail")}
                  </Label>
                  <Input
                    id="current_email"
                    type="email"
                    value={userProfile?.email || ""}
                    disabled
                    className="bg-muted"
                  />
                </div>

                <div>
                  <Label htmlFor="new_email">
                    {t("adminSettings.newEmail")}
                  </Label>
                  <Input
                    id="new_email"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder={"email@example.com"}
                  />
                </div>

                <Button
                  onClick={handleUpdateEmail}
                  disabled={updatingEmail || !newEmail}
                  style={{
                    backgroundColor: ADMIN_THEME.primary,
                    color: ADMIN_THEME.textOnPrimary,
                  }}
                  onMouseEnter={(e) => {
                    if (!updatingEmail && newEmail) {
                      e.currentTarget.style.backgroundColor =
                        ADMIN_THEME.primaryHover;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!updatingEmail && newEmail) {
                      e.currentTarget.style.backgroundColor =
                        ADMIN_THEME.primary;
                    }
                  }}
                >
                  {updatingEmail
                    ? t("adminSettings.saving")
                    : t("adminSettings.updateEmail")}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("adminSettings.changePassword")}</CardTitle>
                <CardDescription>
                  {t("adminSettings.accountInfoDesc")}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="new_password">
                    {t("adminSettings.newPassword")}
                  </Label>
                  <Input
                    id="new_password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t("adminSettings.newPasswordPlaceholder")}
                  />
                </div>

                <div>
                  <Label htmlFor="confirm_password">
                    {t("adminSettings.confirmNewPassword")}
                  </Label>
                  <Input
                    id="confirm_password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t("adminSettings.confirmPasswordPlaceholder")}
                  />
                </div>

                <Button
                  onClick={handleUpdatePassword}
                  disabled={
                    updatingPassword || !newPassword || !confirmPassword
                  }
                  style={{
                    backgroundColor: ADMIN_THEME.primary,
                    color: ADMIN_THEME.textOnPrimary,
                  }}
                  onMouseEnter={(e) => {
                    if (!updatingPassword && newPassword && confirmPassword) {
                      e.currentTarget.style.backgroundColor =
                        ADMIN_THEME.primaryHover;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!updatingPassword && newPassword && confirmPassword) {
                      e.currentTarget.style.backgroundColor =
                        ADMIN_THEME.primary;
                    }
                  }}
                >
                  {updatingPassword
                    ? t("adminSettings.saving")
                    : t("adminSettings.updatePassword")}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="contacts">
          {!isManagerMode && (
            <ManagerAccountsManager
              developerId={developerId || userProfile?.id || ""}
            />
          )}

          {isManagerMode && (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">
                Managing managers is only available to the account owner
              </p>

              {managerData && managerData.length > 0 && (
                <div className="mt-2 text-sm text-muted-foreground">
                  <p>Ask owner of the account to add you as a manager</p>
                  <ul className="mt-1 space-y-1">
                    {managerData.map((data) => (
                      <li key={data.id}>
                        • {data.developer_profile?.full_name} (
                        {data.developer_profile?.company_name})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>
                {t("adminSettings.notificationPreferences")}
              </CardTitle>
              <CardDescription>
                {t("adminSettings.notificationPreferencesDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AdminSettingsNotificationsTab
                loading={loadingNotificationPreferences}
                channelEmail={notificationPreferences.channel_email}
                channelPush={notificationPreferences.channel_push}
                channelTelegram={notificationPreferences.channel_telegram}
                telegramUsername={
                  notificationPreferences.telegram_username || ""
                }
                telegramVerified={notificationPreferences.telegram_verified}
                notifyNewLead={notificationPreferences.notify_new_lead}
                notifyTaskDue={notificationPreferences.notify_task_due}
                notifyPaymentReceived={
                  notificationPreferences.notify_payment_received
                }
                notifySystemUpdate={
                  notificationPreferences.notify_system_update
                }
                userEmail={userProfile?.email || ""}
                onToggle={(field, checked) =>
                  handleNotificationPreferenceChange(field as any, checked)
                }
                onTelegramUsernameChange={handleTelegramUsernameChange}
                onTelegramUsernameBlur={verifyTelegramOnBlur}
                t={t}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <CardContent>
              <AdminSettingsTemplatesTab
                templates={messageTemplates}
                loading={loadingMessageTemplates}
                isEditorOpen={isCreatingTemplate || !!editingTemplateId}
                isCreating={isCreatingTemplate}
                editingId={editingTemplateId}
                title={templateTitle}
                content={templateContent}
                onCreate={startCreateTemplate}
                onEdit={startEditTemplate}
                onDelete={deleteTemplate}
                onCloseEditor={cancelTemplateEditor}
                onTitleChange={setTemplateTitle}
                onContentChange={setTemplateContent}
                onSave={saveTemplate}
                t={t}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data">
          <Card>
            <CardHeader>
              <CardTitle>{t("adminSettings.dataManagement")}</CardTitle>
              <CardDescription>
                {t("adminSettings.dataManagementDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AdminSettingsDataTab
                exportingBackup={exportingBackup}
                resettingSettings={resettingSettings}
                onExportBackup={handleExportBackup}
                onResetSettings={handleResetSettings}
                t={t}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSettings;
