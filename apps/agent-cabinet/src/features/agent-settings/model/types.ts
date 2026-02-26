export type UserProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  company_name: string | null;
  phone: string | null;
  preferred_locale: string;
  person_type: string | null;
  tax_id: string | null;
  legal_address: string | null;
  bank_name: string | null;
  iban: string | null;
  billing_currency: string | null;
  is_vat_payer: boolean | null;
  company_type: string | null;
  registered_office: string | null;
  representative_name: string | null;
  representative_title: string | null;
  signature_path: string | null;
  signature_method: string | null;
  signature_meta: unknown;
};

export interface AgentApplicationSettings {
  id: string;
  full_name: string | null;
  company_name: string | null;
  type: string | null;
  tax_id: string | null;
  legal_address: unknown;
  phone: string | null;
  bank_details: unknown;
  agent_company_type: string | null;
  agent_registered_office: string | null;
  agent_representative_name: string | null;
  agent_representative_title: string | null;
  status: string | null;
  agreement_signed_at: unknown;
  commission_rate: unknown;
}

export type SignedContract = {
  id: string;
  signed_at: string | null;
  signed_download_url: string | null;
  signed_contract_mime: string | null;
  template_lang: string | null;
};

export type SettingsTabValue = "company" | "account" | "notifications" | "data";
