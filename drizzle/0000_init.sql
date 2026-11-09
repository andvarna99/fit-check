CREATE TYPE "public"."category" AS ENUM('top', 'bottom', 'dress', 'outerwear', 'shoes', 'accessory');--> statement-breakpoint
CREATE TYPE "public"."item_status" AS ENUM('clean', 'laundry', 'stored');--> statement-breakpoint
CREATE TYPE "public"."occasion" AS ENUM('casual', 'smart_casual', 'formal');--> statement-breakpoint
CREATE TYPE "public"."outfit_source" AS ENUM('user', 'rules', 'ai');--> statement-breakpoint
CREATE TYPE "public"."season" AS ENUM('spring', 'summer', 'fall', 'winter');--> statement-breakpoint
CREATE TYPE "public"."slot" AS ENUM('outerwear', 'top', 'dress', 'bottom', 'shoes', 'accessory');--> statement-breakpoint
CREATE TABLE "item_tags" (
	"item_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "item_tags_item_id_tag_id_pk" PRIMARY KEY("item_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text,
	"category" "category",
	"subcategory" text,
	"colors" text[] DEFAULT '{}'::text[] NOT NULL,
	"pattern" text,
	"material" text,
	"seasons" "season"[] DEFAULT '{}'::season[] NOT NULL,
	"formality" smallint,
	"warmth" smallint,
	"brand" text,
	"price_cents" integer,
	"purchased_on" date,
	"image_url" text,
	"original_image_url" text,
	"status" "item_status" DEFAULT 'clean' NOT NULL,
	"is_draft" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "items_formality_range" CHECK ("items"."formality" between 1 and 5),
	CONSTRAINT "items_warmth_range" CHECK ("items"."warmth" between 1 and 5),
	CONSTRAINT "items_price_nonnegative" CHECK ("items"."price_cents" >= 0),
	CONSTRAINT "items_category_required" CHECK ("items"."is_draft" or "items"."category" is not null)
);
--> statement-breakpoint
CREATE TABLE "outfit_items" (
	"outfit_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"slot" "slot" NOT NULL,
	CONSTRAINT "outfit_items_outfit_id_item_id_pk" PRIMARY KEY("outfit_id","item_id")
);
--> statement-breakpoint
CREATE TABLE "outfits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text,
	"occasion" "occasion",
	"created_by" "outfit_source" DEFAULT 'user' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "tags_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "wear_log_items" (
	"wear_log_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	CONSTRAINT "wear_log_items_wear_log_id_item_id_pk" PRIMARY KEY("wear_log_id","item_id")
);
--> statement-breakpoint
CREATE TABLE "wear_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"outfit_id" uuid,
	"worn_on" date NOT NULL,
	"weather" jsonb,
	"rating" smallint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wear_logs_rating_range" CHECK ("wear_logs"."rating" between 1 and 5)
);
--> statement-breakpoint
ALTER TABLE "item_tags" ADD CONSTRAINT "item_tags_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_tags" ADD CONSTRAINT "item_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outfit_items" ADD CONSTRAINT "outfit_items_outfit_id_outfits_id_fk" FOREIGN KEY ("outfit_id") REFERENCES "public"."outfits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outfit_items" ADD CONSTRAINT "outfit_items_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wear_log_items" ADD CONSTRAINT "wear_log_items_wear_log_id_wear_logs_id_fk" FOREIGN KEY ("wear_log_id") REFERENCES "public"."wear_logs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wear_log_items" ADD CONSTRAINT "wear_log_items_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wear_logs" ADD CONSTRAINT "wear_logs_outfit_id_outfits_id_fk" FOREIGN KEY ("outfit_id") REFERENCES "public"."outfits"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "items_category_idx" ON "items" USING btree ("category");--> statement-breakpoint
CREATE INDEX "items_is_draft_idx" ON "items" USING btree ("is_draft");--> statement-breakpoint
CREATE INDEX "outfit_items_item_idx" ON "outfit_items" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "wear_log_items_item_idx" ON "wear_log_items" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "wear_logs_worn_on_idx" ON "wear_logs" USING btree ("worn_on");