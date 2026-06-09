ALTER TABLE "prompts" ADD COLUMN "created_by_user_id" text;--> statement-breakpoint
ALTER TABLE "prompts" ADD COLUMN "submission_status" text DEFAULT 'approved' NOT NULL;--> statement-breakpoint
ALTER TABLE "prompts" ADD COLUMN "review_notes" text;--> statement-breakpoint
ALTER TABLE "prompts" ADD CONSTRAINT "prompts_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;