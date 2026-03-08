import type { AgencyPartner } from "@/entities/agency-partner";

const toNonEmptyString = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isJsonLikeString = (value: string): boolean => {
  const trimmed = value.trim();
  return (
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"))
  );
};

const parseVatPayer = (value: unknown): boolean | undefined => {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toLowerCase();
  if (["true", "1", "yes"].includes(normalized)) return true;
  if (["false", "0", "no"].includes(normalized)) return false;
  return undefined;
};

export const parseBankDetails = (
  value: unknown,
): AgencyPartner["bankDetails"] => {
  const fromRecord = (
    record: Record<string, unknown>,
  ): AgencyPartner["bankDetails"] => {
    const bankName = toNonEmptyString(record.bank_name);
    const iban = toNonEmptyString(record.iban);
    const billingCurrency = toNonEmptyString(record.billing_currency);
    const isVatPayer = parseVatPayer(record.is_vat_payer);
    const detailsRaw = toNonEmptyString(record.details);
    const details =
      detailsRaw && !isJsonLikeString(detailsRaw) ? detailsRaw : undefined;

    return {
      details,
      bank_name: bankName ?? null,
      iban: iban ?? null,
      billing_currency: billingCurrency ?? null,
      is_vat_payer: isVatPayer ?? null,
    };
  };

  if (isRecord(value)) {
    return fromRecord(value);
  }

  const raw = toNonEmptyString(value);
  if (!raw) return { details: "" };

  try {
    const parsed = JSON.parse(raw);
    if (isRecord(parsed)) return fromRecord(parsed);
  } catch {
    // Not a JSON payload, keep as plain text fallback.
  }

  return {
    details: isJsonLikeString(raw) ? "" : raw,
  };
};
