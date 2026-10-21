import { createHash } from "node:crypto";

/** Meta requires SHA-256 of normalised values, hex encoded, lower case. */
export function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function hashEmail(email?: string | null): string | undefined {
  if (!email) return undefined;
  const normalized = email.trim().toLowerCase();
  if (!normalized.includes("@")) return undefined;
  return sha256(normalized);
}

/** Keeps digits, adds the default country code when the number is local. */
export function normalizePhone(phone?: string | null, defaultCountry = "996"): string | undefined {
  if (!phone) return undefined;
  let digits = phone.replace(/\D/g, "");
  if (!digits) return undefined;
  if (digits.startsWith("00")) digits = digits.slice(2);
  // local format 0XXX XXX XXX → drop the trunk zero
  if (digits.startsWith("0") && digits.length === 10) digits = digits.slice(1);
  if (digits.length === 9) digits = defaultCountry + digits;
  if (digits.length < 8 || digits.length > 15) return undefined;
  return digits;
}

export function hashPhone(phone?: string | null, defaultCountry = "996"): string | undefined {
  const normalized = normalizePhone(phone, defaultCountry);
  return normalized ? sha256(normalized) : undefined;
}

export function hashExternalId(id?: string | null): string | undefined {
  if (!id) return undefined;
  return sha256(id.trim().toLowerCase());
}
