export type TranslationMap = Record<string, string>;

export interface LocalizableConstructionUpdate {
  title: string;
  description: string;
  titleTranslations?: TranslationMap | null;
  descriptionTranslations?: TranslationMap | null;
  title_translations?: TranslationMap | null;
  description_translations?: TranslationMap | null;
  translations?: Record<
    string,
    {
      title?: string | null;
      description?: string | null;
    }
  > | null;
}

const FALLBACK_LANGUAGE_ORDER = ["en", "ru"];

const toBaseLanguageCode = (language: string): string =>
  language.toLowerCase().replace("_", "-").split("-")[0] ?? "en";

const pickFirstNonEmpty = (map?: TranslationMap | null): string | null => {
  if (!map) return null;
  for (const value of Object.values(map)) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  return null;
};

const resolveLocalizedText = ({
  preferredLanguage,
  sourceValue,
  flatTranslations,
  nestedTranslations,
  field,
}: {
  preferredLanguage: string;
  sourceValue: string;
  flatTranslations?: TranslationMap | null | undefined;
  nestedTranslations?: LocalizableConstructionUpdate["translations"];
  field: "title" | "description";
}): string => {
  const preferred = toBaseLanguageCode(preferredLanguage);
  const preferredFromFlat = flatTranslations?.[preferred];
  if (typeof preferredFromFlat === "string" && preferredFromFlat.trim()) {
    return preferredFromFlat.trim();
  }

  const preferredFromNested = nestedTranslations?.[preferred]?.[field];
  if (
    typeof preferredFromNested === "string" &&
    preferredFromNested.trim().length > 0
  ) {
    return preferredFromNested.trim();
  }

  for (const fallbackLang of FALLBACK_LANGUAGE_ORDER) {
    const fromFlat = flatTranslations?.[fallbackLang];
    if (typeof fromFlat === "string" && fromFlat.trim().length > 0) {
      return fromFlat.trim();
    }
    const fromNested = nestedTranslations?.[fallbackLang]?.[field];
    if (typeof fromNested === "string" && fromNested.trim().length > 0) {
      return fromNested.trim();
    }
  }

  const anyFlat = pickFirstNonEmpty(flatTranslations);
  if (anyFlat) return anyFlat;

  if (nestedTranslations) {
    for (const nested of Object.values(nestedTranslations)) {
      const value = nested?.[field];
      if (typeof value === "string" && value.trim().length > 0) {
        return value.trim();
      }
    }
  }

  return sourceValue;
};

export const resolveConstructionUpdateLocale = (
  update: LocalizableConstructionUpdate,
  language: string,
): { title: string; description: string } => {
  const titleTranslations =
    update.titleTranslations ?? update.title_translations;
  const descriptionTranslations =
    update.descriptionTranslations ?? update.description_translations;

  return {
    title: resolveLocalizedText({
      preferredLanguage: language,
      sourceValue: update.title,
      flatTranslations: titleTranslations,
      nestedTranslations: update.translations,
      field: "title",
    }),
    description: resolveLocalizedText({
      preferredLanguage: language,
      sourceValue: update.description,
      flatTranslations: descriptionTranslations,
      nestedTranslations: update.translations,
      field: "description",
    }),
  };
};
