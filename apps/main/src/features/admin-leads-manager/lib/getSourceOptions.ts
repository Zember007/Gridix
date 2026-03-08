type SourceOption = { value: string; label: string };

export const getSourceOptions = (
  t: (key: string) => string,
): SourceOption[] => [
  { value: "all", label: t("leads.filters.allSources") },
  { value: "instagram", label: t("leads.sources.instagram") },
  { value: "website", label: t("leads.sources.website") },
  { value: "referral", label: t("leads.sources.referral") },
  { value: "walk_in", label: t("leads.sources.walk_in") },
  { value: "facebook", label: t("leads.sources.facebook") },
];
