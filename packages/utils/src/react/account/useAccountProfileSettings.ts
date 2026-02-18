import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../api/supabase";
import { useLanguage } from "../language/LanguageContext";

const SUPPORTED_LOCALES = ["en", "ru", "ka", "he", "ar", "tr"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
export { SUPPORTED_LOCALES };

export interface AccountProfileData {
  full_name: string;
  phone: string;
  company_name: string;
}

export interface UseAccountProfileSettingsOptions {
  userId: string | undefined;
}

export function useAccountProfileSettings({
  userId,
}: UseAccountProfileSettingsOptions) {
  const { t } = useLanguage();

  const [profileData, setProfileData] = useState<AccountProfileData>({
    full_name: "",
    phone: "",
    company_name: "",
  });

  const [preferredLocale, setPreferredLocale] = useState<SupportedLocale>("en");

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const load = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("user_profiles")
          .select("company_name, full_name, phone, preferred_locale")
          .eq("id", userId)
          .single();

        if (error) {
          console.error("Error loading profile:", error);
          return;
        }

        setProfileData({
          full_name: (data as Record<string, unknown>)?.full_name
            ? String((data as Record<string, unknown>).full_name)
            : "",
          phone: (data as Record<string, unknown>)?.phone
            ? String((data as Record<string, unknown>).phone)
            : "",
          company_name: (data as Record<string, unknown>)?.company_name
            ? String((data as Record<string, unknown>).company_name)
            : "",
        });

        const rawLocale = String(
          (data as Record<string, unknown>)?.preferred_locale ?? "",
        )
          .trim()
          .toLowerCase();

        if ((SUPPORTED_LOCALES as readonly string[]).includes(rawLocale)) {
          setPreferredLocale(rawLocale as SupportedLocale);
        } else {
          setPreferredLocale("en");
        }
      } catch (error) {
        console.error("Error in loadProfileData:", error);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [userId]);

  const handleProfileFieldChange = useCallback(
    (field: keyof AccountProfileData, value: string) => {
      setProfileData((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const saveProfile = useCallback(async () => {
    if (!userId) return;

    const profilePayload = {
      company_name: profileData.company_name,
      full_name: profileData.full_name,
      phone: profileData.phone,
      preferred_locale: preferredLocale,
      updated_at: new Date().toISOString(),
    };

    const { data: result, error } = await supabase
      .from("user_profiles")
      .update(profilePayload)
      .eq("id", userId)
      .select();

    if (error) {
      console.error("Supabase profile error:", error);
      throw error;
    }

    if (result && result.length > 0) {
      const row = result[0] as Record<string, unknown>;
      setProfileData({
        company_name: row?.company_name ? String(row.company_name) : "",
        full_name: row?.full_name ? String(row.full_name) : "",
        phone: row?.phone ? String(row.phone) : "",
      });
    }
  }, [userId, profileData, preferredLocale]);

  return {
    profileData,
    preferredLocale,
    setPreferredLocale,
    loading,
    handleProfileFieldChange,
    saveProfile,
    SUPPORTED_LOCALES,
    t,
  };
}
