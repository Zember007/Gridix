// Legacy compatibility re-exports.
// New code should import from dedicated modules:
// - cn: `@gridix/utils/lib/cn`
// - slug: `@gridix/utils/lib/slug`
// - datetime: `@gridix/utils/lib/datetime`
// - urls: `@gridix/utils/config/urls`

export { cn } from "./cn";
export { generateSlug } from "./slug";
export { formatDate, formatDateTime, getRelativeTime } from "./datetime";
export { AMOCRM_DEVELOPER_CABINET_URL } from "../config/urls";
