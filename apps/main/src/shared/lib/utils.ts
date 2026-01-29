// Legacy compatibility re-exports.
// New code should import from dedicated modules:
// - cn: `@/shared/lib/cn`
// - slug: `@/shared/lib/slug`
// - datetime: `@/shared/lib/datetime`
// - urls: `@/shared/config/urls`

export { cn } from "@gridix/utils/lib";
export { generateSlug } from "@gridix/utils/lib";
export { formatDate, formatDateTime, getRelativeTime } from "@gridix/utils/lib";
export { AMOCRM_DEVELOPER_CABINET_URL } from "@/shared/config/urls";

