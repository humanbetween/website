import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  uuid,
  bigserial,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/* -------------------------------------------------------------------------- */
/*  BetterAuth core tables                                                    */
/* -------------------------------------------------------------------------- */

export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    name: text("name"),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").notNull().default(false),
    image: text("image"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("users_created_at").on(t.createdAt.desc())],
);

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const accounts = pgTable("accounts", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const verifications = pgTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* -------------------------------------------------------------------------- */
/*  App tables                                                                */
/* -------------------------------------------------------------------------- */

export const profiles = pgTable("profiles", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  role: text("role").notNull().default("user"),
  subscriptionTier: text("subscription_tier").notNull().default("free"),
  subscriptionStatus: text("subscription_status").notNull().default("inactive"),
  stripeCustomerId: text("stripe_customer_id"),
  subscriptionCurrentPeriodEnd: timestamp("subscription_current_period_end", {
    withTimezone: true,
  }),
  welcomeEmailSentAt: timestamp("welcome_email_sent_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type PromptAsset = {
  name: string;
  url: string;
  sizeBytes: number;
  type: string;
};

export const prompts = pgTable(
  "prompts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    promptText: text("prompt"),
    websiteUrl: text("website_url"),
    priceCents: integer("price_cents").notNull().default(0),
    isFree: boolean("is_free").notNull().default(false),
    videoUrl: text("video_url").notNull(),
    thumbnailUrl: text("thumbnail_url"),
    referenceImageUrl: text("reference_image_url"),
    assets: jsonb("assets")
      .$type<PromptAsset[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    categories: text("categories")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    tags: text("tags")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    tools: text("tools")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    popularityCount: integer("popularity_count").notNull().default(0),
    favoriteCount: integer("favorite_count").notNull().default(0),
    displayOrder: integer("display_order").notNull().default(0),
    isPublished: boolean("is_published").notNull().default(true),
    // When true, the product video plays with sound (via an unmute control).
    hasAudio: boolean("has_audio").notNull().default(false),
    // Creator submissions: who uploaded it and its review state. Admin-created
    // prompts have a null author and default to "approved".
    createdByUserId: text("created_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    submissionStatus: text("submission_status").notNull().default("approved"),
    reviewNotes: text("review_notes"),
    // Admin-set creator credit (name + avatar) for products not tied to a real
    // affiliate account. When set, these win over the createdByUserId author.
    manualCreatorName: text("manual_creator_name"),
    manualCreatorAvatarUrl: text("manual_creator_avatar_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    index("prompts_categories_gin").using("gin", t.categories),
    index("prompts_tags_gin").using("gin", t.tags),
    index("prompts_popularity")
      .on(t.popularityCount.desc())
      .where(sql`${t.deletedAt} IS NULL`),
    index("prompts_created_at")
      .on(t.createdAt.desc())
      .where(sql`${t.deletedAt} IS NULL`),
    index("prompts_display_order")
      .on(t.displayOrder.asc(), t.createdAt.desc())
      .where(sql`${t.deletedAt} IS NULL`),
  ],
);

export const purchases = pgTable(
  "purchases",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    promptId: uuid("prompt_id").references(() => prompts.id, {
      onDelete: "set null",
    }),
    stripePaymentIntentId: text("stripe_payment_intent_id"),
    stripeSubscriptionId: text("stripe_subscription_id"),
    type: text("type").notNull(),
    amountCents: integer("amount_cents").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("purchases_user_id").on(t.userId),
    index("purchases_created_at").on(t.createdAt.desc()),
    uniqueIndex("purchases_user_prompt_unique")
      .on(t.userId, t.promptId)
      .where(sql`${t.promptId} IS NOT NULL`),
  ],
);

export const favorites = pgTable(
  "favorites",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    promptId: uuid("prompt_id")
      .notNull()
      .references(() => prompts.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("favorites_user_prompt_pk").on(t.userId, t.promptId),
    index("favorites_user_id_created_at").on(t.userId, t.createdAt.desc()),
    index("favorites_prompt_id").on(t.promptId),
  ],
);

export const promptClicks = pgTable(
  "prompt_clicks",
  {
    id: bigserial("id", { mode: "bigint" }).primaryKey(),
    promptId: uuid("prompt_id")
      .notNull()
      .references(() => prompts.id, { onDelete: "cascade" }),
    userId: text("user_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("prompt_clicks_prompt_id_created_at").on(t.promptId, t.createdAt.desc()),
  ],
);

export const newsletterSubscribers = pgTable(
  "newsletter_subscribers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull().unique(),
    source: text("source").notNull().default("unknown"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("newsletter_subscribers_created_at").on(t.createdAt.desc())],
);

export const siteSettings = pgTable("site_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* -------------------------------------------------------------------------- */
/*  Affiliate / creator program                                               */
/* -------------------------------------------------------------------------- */

// One row per creator. Existence of a row = "this user is a creator". The
// referral balance is derived from the commissions ledger, never stored here.
export const affiliateAccounts = pgTable(
  "affiliate_accounts",
  {
    userId: text("user_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    status: text("status").notNull().default("active"), // "active" | "suspended"
    commissionRateBps: integer("commission_rate_bps").notNull().default(1000),
    avatarUrl: text("avatar_url"),
    // Stripe Connect Express payout account.
    stripeConnectAccountId: text("stripe_connect_account_id"),
    payoutsEnabled: boolean("payouts_enabled").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("affiliate_accounts_code_unique").on(t.code)],
);

// Attribution: a referred customer belongs to one affiliate (first-touch).
export const referrals = pgTable(
  "referrals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    affiliateUserId: text("affiliate_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    referredUserId: text("referred_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    stripeCustomerId: text("stripe_customer_id"),
    stripeSubscriptionId: text("stripe_subscription_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("referrals_affiliate_user_id").on(t.affiliateUserId),
    index("referrals_subscription").on(t.stripeSubscriptionId),
    // First-touch: a customer is locked to the first affiliate who referred them.
    uniqueIndex("referrals_referred_user_unique")
      .on(t.referredUserId)
      .where(sql`${t.referredUserId} IS NOT NULL`),
  ],
);

// Commission ledger. Balance = SUM(commissionCents) WHERE status = 'payable'.
// stripeChargeKey is the canonical idempotency key (payment_intent for one-time,
// invoice id for subscription) so webhook retries can't double-credit.
export const commissions = pgTable(
  "commissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    affiliateUserId: text("affiliate_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    referralId: uuid("referral_id").references(() => referrals.id, {
      onDelete: "set null",
    }),
    sourceType: text("source_type").notNull(), // "one_time" | "subscription"
    stripeChargeKey: text("stripe_charge_key").notNull(),
    stripeSubscriptionId: text("stripe_subscription_id"),
    saleAmountCents: integer("sale_amount_cents").notNull(),
    commissionCents: integer("commission_cents").notNull(),
    status: text("status").notNull().default("payable"), // "payable" | "paid" | "reversed"
    // Held until this date (sale + holdDays), then eligible for auto-payout.
    maturesAt: timestamp("matures_at", { withTimezone: true }),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    payoutId: uuid("payout_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("commissions_charge_key_unique").on(t.stripeChargeKey),
    index("commissions_affiliate_created").on(
      t.affiliateUserId,
      t.createdAt.desc(),
    ),
    index("commissions_subscription").on(t.stripeSubscriptionId),
    index("commissions_status_matures").on(t.status, t.maturesAt),
  ],
);

// One row per Stripe transfer to a creator's connected account.
export const payouts = pgTable(
  "payouts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    affiliateUserId: text("affiliate_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    stripeTransferId: text("stripe_transfer_id"),
    amountCents: integer("amount_cents").notNull(),
    status: text("status").notNull().default("paid"), // "paid" | "failed"
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("payouts_affiliate_created").on(
      t.affiliateUserId,
      t.createdAt.desc(),
    ),
    uniqueIndex("payouts_transfer_unique")
      .on(t.stripeTransferId)
      .where(sql`${t.stripeTransferId} IS NOT NULL`),
  ],
);

export type User = typeof users.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
export type Prompt = typeof prompts.$inferSelect;
export type PromptInsert = typeof prompts.$inferInsert;
export type Purchase = typeof purchases.$inferSelect;
export type SiteSetting = typeof siteSettings.$inferSelect;
export type AffiliateAccount = typeof affiliateAccounts.$inferSelect;
export type Referral = typeof referrals.$inferSelect;
export type Commission = typeof commissions.$inferSelect;
export type Payout = typeof payouts.$inferSelect;
