ALTER TABLE "prompts" ALTER COLUMN "prompt" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "prompts" ADD COLUMN "website_url" text;