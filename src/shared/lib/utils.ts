// Legacy compatibility re-exports.
// New code should import from dedicated modules:
// - cn: `@/shared/lib/cn`
// - slug: `@/shared/lib/slug`
// - datetime: `@/shared/lib/datetime`
// - urls: `@/shared/config/urls`

export { cn } from "@/shared/lib/cn";
export { generateSlug } from "@/shared/lib/slug";
export { formatDate, formatDateTime, getRelativeTime } from "@/shared/lib/datetime";
export { AMOCRM_DEVELOPER_CABINET_URL } from "@/shared/config/urls";

