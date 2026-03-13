export type Template = {
  id: number;
  name: string;
  lang: string;
  storage_path: string;
  created_at: string;
  updated_at: string;
  url: string | null;
  date: string;
};

export type GeneralConditionsSettings = {
  defaultCommission: number;
  leadLockDays: number;
  payoutTerms: string;
  productsDescription: string;
  territory: string;
  exclusivity: "exclusive" | "non-exclusive";
  agreementEffectiveDate: string;
  agreementEndDate: string;
  forceMajeureWeeks: number;
  originalsCount: number;
  developerCompanyType: string;
  developerRegisteredOffice: string;
  developerRepresentativeName: string;
  developerRepresentativeTitle: string;
  developerSignaturePath: string | null;
  developerStampPath: string | null;
};
