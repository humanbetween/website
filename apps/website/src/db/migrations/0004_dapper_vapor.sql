CREATE TABLE "favorites" (
	"user_id" text NOT NULL,
	"prompt_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "prompts" ADD COLUMN "favorite_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_prompt_id_prompts_id_fk" FOREIGN KEY ("prompt_id") REFERENCES "public"."prompts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "favorites_user_prompt_pk" ON "favorites" USING btree ("user_id","prompt_id");--> statement-breakpoint
CREATE INDEX "favorites_user_id_created_at" ON "favorites" USING btree ("user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "favorites_prompt_id" ON "favorites" USING btree ("prompt_id");