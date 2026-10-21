import type { MetadataRoute } from "next";

const base = process.env.PUBLIC_BASE_URL || "https://esmar.kg";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/admin"] }],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
