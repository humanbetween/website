/**
 * Seed the prompts table with 12 placeholder rows using /seed/prompt-N.jpg
 * media (copied to public/seed/ from the Lovable starter).
 *
 * Run with: DATABASE_URL=... bun run src/db/seed.ts
 */

import { db, schema } from "@/lib/db";
import type { Category } from "@/lib/prompts/types";

type Seed = {
  title: string;
  description: string;
  promptText: string;
  categories: Category[];
  tools: string[];
  tags: string[];
  isFree: boolean;
  priceCents: number;
};

const seeds: Seed[] = Array.from({ length: 12 }, (_, i) => {
  const n = i + 1;
  const categoryRotation: Category[] = [
    "VIDEO",
    "IMAGE",
    "WEBSITE",
    "BACKGROUND",
    "VIDEO",
    "IMAGE",
    "WEBSITE",
    "BACKGROUND",
    "VIDEO",
    "IMAGE",
    "WEBSITE",
    "PRESENTATION",
  ];
  const cat = categoryRotation[i] ?? "IMAGE";
  return {
    title: `Demo prompt ${n}`,
    description:
      "Placeholder prompt seeded from the Lovable starter assets. Replace via /admin.",
    promptText:
      `A high-fidelity ${cat.toLowerCase()} composition with cinematic lighting, ` +
      `shallow depth of field, and a confident editorial tone. ` +
      `[Replace this placeholder prompt #${n} via the admin panel.]`,
    categories: [cat],
    tools: cat === "VIDEO" ? ["Runway", "Veo"] : ["Midjourney", "Flux"],
    tags: ["editorial", "cinematic"],
    isFree: n % 4 === 0,
    priceCents: n % 4 === 0 ? 0 : 500,
  };
});

async function main() {
  const existing = await db.select().from(schema.prompts).limit(1);
  if (existing.length > 0) {
    console.log("[seed] prompts table already has rows, aborting.");
    return;
  }

  const rows = seeds.map((s, i) => ({
    title: s.title,
    description: s.description,
    promptText: s.promptText,
    priceCents: s.priceCents,
    isFree: s.isFree,
    videoUrl: `/seed/prompt-${i + 1}.jpg`,
    thumbnailUrl: null,
    categories: s.categories,
    tags: s.tags,
    tools: s.tools,
  }));

  await db.insert(schema.prompts).values(rows);
  console.log(`[seed] inserted ${rows.length} prompts.`);
}

main().catch((err) => {
  console.error("[seed] failed:", err);
  process.exit(1);
});
