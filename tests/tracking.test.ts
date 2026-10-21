import { describe, expect, it } from "vitest";
import { hasPaidClick, sanitizeAttribution, sanitizeCookies } from "@/lib/attribution";
import { hashExternalId, hashPhone, normalizePhone } from "@/lib/hash";
import { resolveStage } from "@/lib/meta/events";
import { signPayload, verifySignature } from "@/lib/signature";

describe("attribution", () => {
  it("keeps known click ids and builds fbc from fbclid", () => {
    const attr = sanitizeAttribution({
      fbclid: "ABC",
      click_ts: 1700000000,
      utm: { source: "facebook", campaign: "kg" },
      landing_url: "https://land.esmar.kg/ky?fbclid=ABC",
    });
    expect(attr?.fbc).toBe("fb.1.1700000000000.ABC");
    expect(attr?.utm.source).toBe("facebook");
    expect(hasPaidClick(attr)).toBe(true);
  });

  it("drops unknown keys and caps long values", () => {
    const attr = sanitizeAttribution({
      landing_url: "https://x.kg/",
      evil: "rm -rf",
      utm: { source: "a".repeat(500) },
      fbclid: "b".repeat(2000),
    });
    expect(attr).not.toBeNull();
    expect((attr as Record<string, unknown>).evil).toBeUndefined();
    expect(attr?.utm.source?.length).toBe(200);
    expect(attr?.fbclid?.length).toBe(512);
  });

  it("requires a landing url", () => {
    expect(sanitizeAttribution({ fbclid: "x" })).toBeNull();
    expect(sanitizeAttribution(null)).toBeNull();
  });

  it("strips control characters", () => {
    const attr = sanitizeAttribution({
      landing_url: "https://x.kg/",
      utm: { campaign: "a\u0000b\nc" },
    });
    expect(attr?.utm.campaign).toBe("abc");
  });
});

describe("attribution cookies", () => {
  it("keeps only known advertising cookies", () => {
    const cookies = sanitizeCookies({
      _gcl_au: "1.1.123",
      _ttp: "abc",
      _ga: "GA1.1.1.1",
      sessionid: "secret",
    });
    expect(cookies).toEqual({ _gcl_au: "1.1.123", _ttp: "abc" });
  });

  it("drops oversized values and empty objects", () => {
    expect(sanitizeCookies({ _ttp: "x".repeat(900) })?.["_ttp"].length).toBe(300);
    expect(sanitizeCookies({ nope: "1" })).toBeUndefined();
  });
});

describe("hashing", () => {
  it("normalises KG phone numbers", () => {
    expect(normalizePhone("+996 222 111 114")).toBe("996222111114");
    expect(normalizePhone("0222111114")).toBe("996222111114");
    expect(normalizePhone("12")).toBeUndefined();
  });

  it("hashes phone and external id with sha256", () => {
    expect(hashPhone("+996222111114")).toMatch(/^[a-f0-9]{64}$/);
    expect(hashExternalId("ESM-ABC")).toBe(hashExternalId("esm-abc"));
  });
});

describe("crm stage mapping", () => {
  it("maps the CRM card creation to Meta Lead", () => {
    expect(resolveStage("card_created")?.event).toBe("Lead");
  });

  it("maps a won deal to Purchase with value", () => {
    const rule = resolveStage("deal_won");
    expect(rule?.event).toBe("Purchase");
    expect(rule?.useLeadValue).toBe(true);
  });

  it("allows explicit custom event names", () => {
    expect(resolveStage("MyCustomEvent")?.event).toBe("MyCustomEvent");
  });

  it("rejects garbage", () => {
    expect(resolveStage("../../etc/passwd")).toBeNull();
  });
});

describe("webhook signature", () => {
  const secret = "super_secret_value";
  const body = JSON.stringify({ lead_id: "ESM-1", stage: "card_created" });

  it("verifies a freshly signed payload", () => {
    const header = signPayload(secret, body);
    expect(verifySignature(secret, body, header)).toBe(true);
  });

  it("rejects tampered bodies", () => {
    const header = signPayload(secret, body);
    expect(verifySignature(secret, body.replace("card_created", "deal_won"), header)).toBe(false);
  });

  it("rejects stale timestamps", () => {
    const header = signPayload(secret, body, Math.floor(Date.now() / 1000) - 3600);
    expect(verifySignature(secret, body, header)).toBe(false);
  });

  it("rejects missing header", () => {
    expect(verifySignature(secret, body, null)).toBe(false);
  });
});
