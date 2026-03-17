export interface ContractVariableKey {
  key: string;
  labelKey: string;
}

export const CONTRACT_VARIABLE_KEYS: ContractVariableKey[] = [
  { key: "{{agent.full_name}}", labelKey: "contractVarsAgentFullName" },
  { key: "{{agent.person_type}}", labelKey: "contractVarsAgentPersonType" },
  { key: "{{agent.company_name}}", labelKey: "contractVarsAgentCompanyName" },
  { key: "{{agent.company_type}}", labelKey: "contractVarsAgentCompanyType" },
  { key: "{{agent.tax_id}}", labelKey: "contractVarsAgentTaxId" },
  {
    key: "{{agent.legal_address}}",
    labelKey: "contractVarsAgentLegalAddress",
  },
  {
    key: "{{agent.registered_office}}",
    labelKey: "contractVarsAgentRegisteredOffice",
  },
  {
    key: "{{agent.represented_by_name}}",
    labelKey: "contractVarsAgentRepresentedByName",
  },
  {
    key: "{{agent.represented_by_title}}",
    labelKey: "contractVarsAgentRepresentedByTitle",
  },
  { key: "{{agent.email}}", labelKey: "contractVarsAgentEmail" },
  { key: "{{agent.phone}}", labelKey: "contractVarsAgentPhone" },
  { key: "{{date.today}}", labelKey: "contractVarsDateToday" },
  { key: "{{commission_rate}}", labelKey: "contractVarsCommissionRate" },
  {
    key: "{{program.default_commission_rate}}",
    labelKey: "contractVarsProgramDefaultCommissionRate",
  },
  {
    key: "{{program.payout_terms}}",
    labelKey: "contractVarsProgramPayoutTerms",
  },
  {
    key: "{{program.products_description}}",
    labelKey: "contractVarsProgramProductsDescription",
  },
  { key: "{{program.territory}}", labelKey: "contractVarsProgramTerritory" },
  {
    key: "{{program.exclusivity}}",
    labelKey: "contractVarsProgramExclusivity",
  },
  {
    key: "{{program.agreement_effective_date}}",
    labelKey: "contractVarsProgramAgreementEffectiveDate",
  },
  {
    key: "{{program.agreement_end_date}}",
    labelKey: "contractVarsProgramAgreementEndDate",
  },
  {
    key: "{{program.force_majeure_weeks}}",
    labelKey: "contractVarsProgramForceMajeureWeeks",
  },
  {
    key: "{{program.originals_count}}",
    labelKey: "contractVarsProgramOriginalsCount",
  },
  {
    key: "{{{signatures.developer_stamp}}}",
    labelKey: "contractVarsDeveloperStamp",
  },
  {
    key: "{{{signatures.developer}}}",
    labelKey: "contractVarsDeveloperSignature",
  },
  { key: "{{{signatures.agent}}}", labelKey: "contractVarsAgentSignature" },
  {
    key: "{{developer.company_name}}",
    labelKey: "contractVarsDeveloperCompany",
  },
  {
    key: "{{developer.full_name}}",
    labelKey: "contractVarsDeveloperFullName",
  },
  {
    key: "{{developer.company_type}}",
    labelKey: "contractVarsDeveloperCompanyType",
  },
  { key: "{{developer.tax_id}}", labelKey: "contractVarsDeveloperTaxId" },
  {
    key: "{{developer.legal_address}}",
    labelKey: "contractVarsDeveloperLegalAddress",
  },
  {
    key: "{{developer.registered_office}}",
    labelKey: "contractVarsDeveloperRegisteredOffice",
  },
  {
    key: "{{developer.represented_by_name}}",
    labelKey: "contractVarsDeveloperRepresentedByName",
  },
  {
    key: "{{developer.represented_by_title}}",
    labelKey: "contractVarsDeveloperRepresentedByTitle",
  },
  { key: "{{developer.email}}", labelKey: "contractVarsDeveloperEmail" },
  { key: "{{developer.phone}}", labelKey: "contractVarsDeveloperPhone" },
  { key: "{{date_text}}", labelKey: "contractVarsDateText" },
];

const VARIABLE_WRAPPER_REGEX = /^\{\{\{?\s*([^{}]+?)\s*\}?\}\}$/;

/**
 * Flat placeholders (without dot notation), e.g. {{partner_name}} or {{{sign_image}}}.
 * Used as a single source of truth for legacy alias payload fields.
 */
export const CONTRACT_FLAT_VARIABLE_ALIASES = CONTRACT_VARIABLE_KEYS.map(
  (item) => {
    const match = item.key.match(VARIABLE_WRAPPER_REGEX);
    return match?.[1] ?? null;
  },
).filter((key): key is string => {
  if (key === null) return false;
  return !key.includes(".");
});
