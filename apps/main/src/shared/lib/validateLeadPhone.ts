/**
 * Extract digits from a phone string (ignores spaces, dashes, parentheses, etc.).
 */
export function extractPhoneDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}

/**
 * International phone suitable for lead forms: 10–15 digits total (ITU E.164 max).
 * User may paste "+995 …" or local formatting; only digit count matters.
 */
export function isValidLeadPhone(phone: string): boolean {
  const digits = extractPhoneDigits(phone);
  return digits.length >= 10 && digits.length <= 15;
}

/** Normalized E.164-style value for CRM (leading +). */
export function normalizeLeadPhoneE164(phone: string): string {
  const digits = extractPhoneDigits(phone);
  return digits.length > 0 ? `+${digits}` : "";
}
