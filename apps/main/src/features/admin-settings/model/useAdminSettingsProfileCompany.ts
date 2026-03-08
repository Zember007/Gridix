import { useEffect, useState } from "react";
import { type User as SupabaseUser } from "@supabase/supabase-js";

import { supabase } from "@/shared/api/supabase";
import type { AdminSettingsForm, CompanySettings } from "./types";

const createInitialSettings = (
  userProfile: SupabaseUser,
): AdminSettingsForm => ({
  user_id: userProfile?.id || "",
  company_name: "",
  full_name: "",
  phone: "",
});

const createInitialCompanySettings = (
  userProfile: SupabaseUser,
): CompanySettings => ({
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

const generateDomainSlug = (name: string) => {
  if (!name) return "your-company";
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

export const useAdminSettingsProfileCompany = (userProfile: SupabaseUser) => {
  const [settings, setSettings] = useState<AdminSettingsForm>(
    createInitialSettings(userProfile),
  );
  const [companySettings, setCompanySettings] = useState<CompanySettings>(
    createInitialCompanySettings(userProfile),
  );

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

  const handleCompanyInputChange = (
    field: keyof CompanySettings,
    value: string | boolean | null,
  ) => {
    setCompanySettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleInputChange = (field: keyof AdminSettingsForm, value: string) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const getSystemDomain = () => {
    return (
      companySettings.system_domain ||
      `${generateDomainSlug(settings.company_name)}.gridix.live`
    );
  };

  return {
    settings,
    setSettings,
    companySettings,
    setCompanySettings,
    handleCompanyInputChange,
    handleInputChange,
    getSystemDomain,
  };
};
