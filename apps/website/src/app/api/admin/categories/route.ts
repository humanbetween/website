import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import {
  addPromptCategory,
  addPromptSubcategory,
  renamePromptCategory,
} from "@/lib/site-settings";

export const dynamic = "force-dynamic";

const KEY_RE = /^[A-Z0-9_]{1,40}$/;
const bodySchema = z.object({
  label: z.string().min(1).max(40),
  // When set, create a subcategory under this existing top-level category.
  parent: z.string().regex(KEY_RE).optional(),
});

const patchSchema = z.object({
  key: z.string().regex(KEY_RE),
  label: z.string().min(1).max(40),
});

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !(await isAdmin(session.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    const categories = parsed.data.parent
      ? await addPromptSubcategory(parsed.data.parent, parsed.data.label)
      : await addPromptCategory(parsed.data.label);
    return NextResponse.json({ categories });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Add failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !(await isAdmin(session.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    const categories = await renamePromptCategory(
      parsed.data.key,
      parsed.data.label,
    );
    return NextResponse.json({ categories });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Rename failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
