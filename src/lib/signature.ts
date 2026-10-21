import { createHmac, timingSafeEqual } from "node:crypto";

/** `t=<unix>,v1=<hex hmac of "<t>.<raw body>">` */
export function signPayload(secret: string, rawBody: string, timestamp = Math.floor(Date.now() / 1000)): string {
  const signature = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
  return `t=${timestamp},v1=${signature}`;
}

export function verifySignature(
  secret: string,
  rawBody: string,
  header: string | null,
  toleranceSeconds = 300,
): boolean {
  if (!header) return false;
  const parts = Object.fromEntries(
    header.split(",").map((part) => {
      const [k, v] = part.trim().split("=");
      return [k, v];
    }),
  ) as Record<string, string | undefined>;

  const ts = Number(parts.t);
  const provided = parts.v1;
  if (!ts || !provided || !Number.isFinite(ts)) return false;
  if (Math.abs(Math.floor(Date.now() / 1000) - ts) > toleranceSeconds) return false;

  const expected = createHmac("sha256", secret).update(`${ts}.${rawBody}`).digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(provided, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
