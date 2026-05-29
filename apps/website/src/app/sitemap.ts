import type { MetadataRoute } from "next";
import { desc, isNull } from "drizzle-orm";
import { db, schema } from "@/lib/db";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://humanbetween.ai";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/pricing`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/auth/sign-in`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/auth/sign-up`, changeFrequency: "yearly", priority: 0.3 },
  ];

  try {
    const rows = await db
      .select({
        id: schema.prompts.id,
        updatedAt: schema.prompts.updatedAt,
      })
      .from(schema.prompts)
      .where(isNull(schema.prompts.deletedAt))
      .orderBy(desc(schema.prompts.updatedAt))
      .limit(2000);

    const promptRoutes: MetadataRoute.Sitemap = rows.map((r) => ({
      url: `${BASE}/prompt/${r.id}`,
      lastModified: r.updatedAt,
      changeFrequency: "weekly",
      priority: 0.6,
    }));
    return [...staticRoutes, ...promptRoutes];
  } catch {
    return staticRoutes;
  }
}
