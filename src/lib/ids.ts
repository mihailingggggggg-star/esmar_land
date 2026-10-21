import { randomBytes, randomUUID } from "node:crypto";

const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // no 0/O/1/I ambiguity

/** Short human-friendly reference: ESM-7K4Q2M — sits in the WhatsApp text and ties the chat to the CRM card. */
export function newLeadId(): string {
  const bytes = randomBytes(6);
  let out = "";
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length];
  return `ESM-${out}`;
}

export function newEventId(leadId?: string, name?: string): string {
  if (leadId && name) {
    const suffix = randomBytes(3).toString("hex");
    return `${leadId}-${name.toLowerCase()}-${suffix}`;
  }
  return randomUUID();
}

export function newVisitorId(): string {
  return randomUUID();
}
