import type { MetadataRoute } from "next";

const base = process.env.PUBLIC_BASE_URL || "https://esmar.kg";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${base}/ru`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/ky`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
  ];
}
