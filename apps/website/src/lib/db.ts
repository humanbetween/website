import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@/db/schema";

const url =
  process.env.DATABASE_URL ??
  "postgresql://placeholder:placeholder@placeholder.neon.tech/db";
const client = neon(url);

export const db = drizzle(client, { schema, casing: "snake_case" });
export { schema };
