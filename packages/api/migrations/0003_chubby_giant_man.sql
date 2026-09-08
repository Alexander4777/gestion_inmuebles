CREATE TABLE "propiedad_fotos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"propiedad_id" uuid NOT NULL,
	"nombre_archivo" varchar(255) NOT NULL,
	"nombre_original" varchar(255) NOT NULL,
	"mime_type" varchar(50) NOT NULL,
	"tamano_bytes" integer NOT NULL,
	"orden" integer DEFAULT 0 NOT NULL,
	"es_portada" boolean DEFAULT false NOT NULL,
	"subida_en" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "propiedad_fotos" ADD CONSTRAINT "propiedad_fotos_propiedad_id_propiedades_id_fk" FOREIGN KEY ("propiedad_id") REFERENCES "public"."propiedades"("id") ON DELETE cascade ON UPDATE no action;