CREATE TABLE "catalog_state" (
	"id" text PRIMARY KEY,
	"products" jsonb NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL
);
