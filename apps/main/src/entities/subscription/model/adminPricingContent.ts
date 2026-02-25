interface AdminPlanContentKeys {
  descriptionKey: string;
  featureKeys: string[];
}

type AdminPlanSlug = "basic" | "pro";

const EMPTY_ADMIN_PLAN_CONTENT_KEYS: AdminPlanContentKeys = {
  descriptionKey: "",
  featureKeys: [],
};

const ADMIN_PLAN_CONTENT_KEYS: Record<AdminPlanSlug, AdminPlanContentKeys> = {
  basic: {
    descriptionKey:
      "admin.subscriptionPage.pricing.planContent.basic.description",
    featureKeys: [
      "admin.subscriptionPage.pricing.planContent.basic.features.1",
      "admin.subscriptionPage.pricing.planContent.basic.features.2",
      "admin.subscriptionPage.pricing.planContent.basic.features.3",
      "admin.subscriptionPage.pricing.planContent.basic.features.4",
      "admin.subscriptionPage.pricing.planContent.basic.features.5",
      "admin.subscriptionPage.pricing.planContent.basic.features.6",
      "admin.subscriptionPage.pricing.planContent.basic.features.7",
      "admin.subscriptionPage.pricing.planContent.basic.features.8",
      "admin.subscriptionPage.pricing.planContent.basic.features.9",
      "admin.subscriptionPage.pricing.planContent.basic.features.10",
      "admin.subscriptionPage.pricing.planContent.basic.features.11",
      "admin.subscriptionPage.pricing.planContent.basic.features.12",
      "admin.subscriptionPage.pricing.planContent.basic.features.13",
      "admin.subscriptionPage.pricing.planContent.basic.features.14",
    ],
  },
  pro: {
    descriptionKey:
      "admin.subscriptionPage.pricing.planContent.pro.description",
    featureKeys: [
      "admin.subscriptionPage.pricing.planContent.pro.features.1",
      "admin.subscriptionPage.pricing.planContent.pro.features.2",
      "admin.subscriptionPage.pricing.planContent.pro.features.3",
      "admin.subscriptionPage.pricing.planContent.pro.features.4",
      "admin.subscriptionPage.pricing.planContent.pro.features.5",
      "admin.subscriptionPage.pricing.planContent.pro.features.6",
      "admin.subscriptionPage.pricing.planContent.pro.features.7",
      "admin.subscriptionPage.pricing.planContent.pro.features.8",
      "admin.subscriptionPage.pricing.planContent.pro.features.9",
      "admin.subscriptionPage.pricing.planContent.pro.features.10",
      "admin.subscriptionPage.pricing.planContent.pro.features.11",
      "admin.subscriptionPage.pricing.planContent.pro.features.12",
      "admin.subscriptionPage.pricing.planContent.pro.features.13",
    ],
  },
};

/**
 * Checks whether a plan slug is supported by admin pricing content.
 */
const isAdminPlanSlug = (slug: string): slug is AdminPlanSlug => {
  return slug === "basic" || slug === "pro";
};

/**
 * Returns i18n keys for plan description and features by slug.
 * Falls back to empty keys for unknown slugs.
 */
export const getAdminPricingContentBySlug = (
  slug: string,
): AdminPlanContentKeys => {
  if (!isAdminPlanSlug(slug)) {
    return EMPTY_ADMIN_PLAN_CONTENT_KEYS;
  }

  return ADMIN_PLAN_CONTENT_KEYS[slug];
};
