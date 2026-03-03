export const normalizePhone = (value: string | null | undefined) =>
  value ? value.replace(/[^0-9+]/g, "") : "";

export const normalizeEmail = (value: string | null | undefined) =>
  value ? value.trim().toLowerCase() : "";
