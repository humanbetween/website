CREATE TABLE "payouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"affiliate_user_id" text NOT NULL,
	"stripe_transfer_id" text,
	"amount_cents" integer NOT NULL,
	"status" text DEFAULT 'paid' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "affiliate_accounts" ADD COLUMN "stripe_connect_account_id" text;--> statement-breakpoint
ALTER TABLE "affiliate_accounts" ADD COLUMN "payouts_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "commissions" ADD COLUMN "matures_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "commissions" ADD COLUMN "paid_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "commissions" ADD COLUMN "payout_id" uuid;--> statement-breakpoint
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_affiliate_user_id_users_id_fk" FOREIGN KEY ("affiliate_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "payouts_affiliate_created" ON "payouts" USING btree ("affiliate_user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "payouts_transfer_unique" ON "payouts" USING btree ("stripe_transfer_id") WHERE "payouts"."stripe_transfer_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "commissions_status_matures" ON "commissions" USING btree ("status","matures_at");--> statement-breakpoint
UPDATE "commissions" SET "matures_at" = "created_at" + interval '30 days' WHERE "matures_at" IS NULL;