CREATE TABLE "categories" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL UNIQUE,
	"color" text DEFAULT '#64748b' NOT NULL,
	"monthly_budget" numeric(12,2) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" serial PRIMARY KEY,
	"title" text NOT NULL,
	"amount" numeric(12,2) NOT NULL,
	"category_id" integer NOT NULL,
	"spent_on" date NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "expenses_spent_on_idx" ON "expenses" ("spent_on");--> statement-breakpoint
CREATE INDEX "expenses_category_id_idx" ON "expenses" ("category_id");--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_category_id_categories_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT;