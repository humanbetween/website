CREATE TABLE "affiliate_accounts" (
	"user_id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"commission_rate_bps" integer DEFAULT 1000 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "commissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"affiliate_user_id" text NOT NULL,
	"referral_id" uuid,
	"source_type" text NOT NULL,
	"stripe_charge_key" text NOT NULL,
	"stripe_subscription_id" text,
	"sale_amount_cents" integer NOT NULL,
	"commission_cents" integer NOT NULL,
	"status" text DEFAULT 'payable' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "referrals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"affiliate_user_id" text NOT NULL,
	"code" text NOT NULL,
	"referred_user_id" text,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "affiliate_accounts" ADD CONSTRAINT "affiliate_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_affiliate_user_id_users_id_fk" FOREIGN KEY ("affiliate_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_referral_id_referrals_id_fk" FOREIGN KEY ("referral_id") REFERENCES "public"."referrals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_affiliate_user_id_users_id_fk" FOREIGN KEY ("affiliate_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referred_user_id_users_id_fk" FOREIGN KEY ("referred_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "affiliate_accounts_code_unique" ON "affiliate_accounts" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "commissions_charge_key_unique" ON "commissions" USING btree ("stripe_charge_key");--> statement-breakpoint
CREATE INDEX "commissions_affiliate_created" ON "commissions" USING btree ("affiliate_user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "commissions_subscription" ON "commissions" USING btree ("stripe_subscription_id");--> statement-breakpoint
CREATE INDEX "referrals_affiliate_user_id" ON "referrals" USING btree ("affiliate_user_id");--> statement-breakpoint
CREATE INDEX "referrals_subscription" ON "referrals" USING btree ("stripe_subscription_id");--> statement-breakpoint
CREATE UNIQUE INDEX "referrals_referred_user_unique" ON "referrals" USING btree ("referred_user_id") WHERE "referrals"."referred_user_id" IS NOT NULL;