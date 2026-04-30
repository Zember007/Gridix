import { useState, useEffect, useCallback, useRef } from "react";
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

const accountProfileSignature = (args: {
  full_name: string;
  phone: string;
  company_name: string;
  preferredLocale: string;
}) =>
  JSON.stringify({
    full_name: args.full_name,
    phone: args.phone,
    company_name: args.company_name,
    preferred_locale: args.preferredLocale,
  });

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
  const lastCommittedProfileSignature = useRef<string | null>(null);
  const profileDataRef = useRef(profileData);
  const preferredLocaleRef = useRef(preferredLocale);

  useEffect(() => {
    profileDataRef.current = profileData;
  }, [profileData]);

  useEffect(() => {
    preferredLocaleRef.current = preferredLocale;
  }, [preferredLocale]);

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

        const nextProfile = {
          full_name: (data as Record<string, unknown>)?.full_name
            ? String((data as Record<string, unknown>).full_name)
            : "",
          phone: (data as Record<string, unknown>)?.phone
            ? String((data as Record<string, unknown>).phone)
            : "",
          company_name: (data as Record<string, unknown>)?.company_name
            ? String((data as Record<string, unknown>).company_name)
            : "",
        };

        const rawLocale = String(
          (data as Record<string, unknown>)?.preferred_locale ?? "",
        )
          .trim()
          .toLowerCase();

        const nextLocale: SupportedLocale = (
          SUPPORTED_LOCALES as readonly string[]
        ).includes(rawLocale)
          ? (rawLocale as SupportedLocale)
          : "en";

        setProfileData(nextProfile);
        setPreferredLocale(nextLocale);
        lastCommittedProfileSignature.current = accountProfileSignature({
          ...nextProfile,
          preferredLocale: nextLocale,
        });
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

  const saveProfile = useCallback(
    async (overrides?: {
      company_name?: string;
      full_name?: string;
      phone?: string;
      preferredLocale?: SupportedLocale;
    }) => {
      if (!userId) return;

      const fullName =
        overrides?.full_name !== undefined
          ? overrides.full_name
          : profileDataRef.current.full_name;
      const phone =
        overrides?.phone !== undefined
          ? overrides.phone
          : profileDataRef.current.phone;
      const companyName =
        overrides?.company_name !== undefined
          ? overrides.company_name
          : profileDataRef.current.company_name;
      const locale =
        overrides?.preferredLocale !== undefined
          ? overrides.preferredLocale
          : preferredLocaleRef.current;

      const profilePayload = {
        company_name: companyName,
        full_name: fullName,
        phone: phone,
        preferred_locale: locale,
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
        const next = {
          company_name: row?.company_name ? String(row.company_name) : "",
          full_name: row?.full_name ? String(row.full_name) : "",
          phone: row?.phone ? String(row.phone) : "",
        };
        setProfileData(next);
        if (row?.preferred_locale) {
          const l = String(row.preferred_locale).trim().toLowerCase();
          if ((SUPPORTED_LOCALES as readonly string[]).includes(l)) {
            setPreferredLocale(l as SupportedLocale);
          }
        }
        const rawPreferred = row?.preferred_locale
          ? String(row.preferred_locale).trim().toLowerCase()
          : String(locale);
        const nextPreferred = (SUPPORTED_LOCALES as readonly string[]).includes(
          rawPreferred,
        )
          ? rawPreferred
          : String(locale);
        lastCommittedProfileSignature.current = accountProfileSignature({
          ...next,
          preferredLocale: nextPreferred,
        });
      } else {
        lastCommittedProfileSignature.current = accountProfileSignature({
          full_name: fullName,
          phone: phone,
          company_name: companyName,
          preferredLocale: locale,
        });
      }
    },
    [userId],
  );

  const maybeSaveProfileAfterFieldEdit = useCallback(async () => {
    if (!userId) return;
    const current = {
      full_name: profileDataRef.current.full_name,
      phone: profileDataRef.current.phone,
      company_name: profileDataRef.current.company_name,
      preferredLocale: preferredLocaleRef.current,
    };
    if (
      accountProfileSignature({
        full_name: current.full_name,
        phone: current.phone,
        company_name: current.company_name,
        preferredLocale: current.preferredLocale,
      }) === lastCommittedProfileSignature.current
    ) {
      return;
    }
    await saveProfile();
  }, [userId, saveProfile]);

  const selectPreferredLocale = useCallback(
    (v: SupportedLocale) => {
      setPreferredLocale(v);
      window.setTimeout(() => {
        void saveProfile({ preferredLocale: v });
      }, 0);
    },
    [saveProfile],
  );

  return {
    profileData,
    preferredLocale,
    setPreferredLocale,
    selectPreferredLocale,
    loading,
    handleProfileFieldChange,
    maybeSaveProfileAfterFieldEdit,
    saveProfile,
    SUPPORTED_LOCALES,
    t,
  };
}
