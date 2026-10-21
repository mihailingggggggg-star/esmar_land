type Bucket = { count: number; resetAt: number };

const globalRef = globalThis as unknown as { __esmRate?: Map<string, Bucket> };

function buckets(): Map<string, Bucket> {
  if (!globalRef.__esmRate) globalRef.__esmRate = new Map();
  return globalRef.__esmRate;
}

/**
 * Fixed-window limiter, per instance. Enough to stop casual abuse of the
 * public endpoints without adding an external dependency.
 */
export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; remaining: number } {
  const now = Date.now();
  const map = buckets();
  const bucket = map.get(key);

  if (!bucket || bucket.resetAt <= now) {
    map.set(key, { count: 1, resetAt: now + windowMs });
    if (map.size > 5000) map.clear();
    return { ok: true, remaining: limit - 1 };
  }

  bucket.count += 1;
  return { ok: bucket.count <= limit, remaining: Math.max(0, limit - bucket.count) };
}

export function clientIp(headers: Headers): string {
  const candidates = [
    headers.get("cf-connecting-ip"),
    headers.get("x-vercel-forwarded-for"),
    headers.get("x-real-ip"),
    headers.get("x-forwarded-for"),
  ];
  for (const value of candidates) {
    if (!value) continue;
    const ip = value.split(",")[0]?.trim();
    if (ip) return ip;
  }
  return "0.0.0.0";
}

export function clientCountry(headers: Headers): string | undefined {
  return (
    headers.get("x-vercel-ip-country") ??
    headers.get("cf-ipcountry") ??
    undefined
  )?.toLowerCase();
}

export function clientCity(headers: Headers): string | undefined {
  const city = headers.get("x-vercel-ip-city");
  if (!city) return undefined;
  try {
    return decodeURIComponent(city);
  } catch {
    return city;
  }
}
