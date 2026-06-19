CREATE TYPE "public"."categoria_mantenimiento" AS ENUM('electricidad', 'fontaneria', 'carpinteria', 'albañileria', 'materiales', 'otro');--> statement-breakpoint
CREATE TYPE "public"."estatus_contrato" AS ENUM('vigente', 'proximo-a-vencer', 'vencido', 'terminado', 'cancelado');--> statement-breakpoint
CREATE TYPE "public"."estatus_mantenimiento" AS ENUM('pendiente', 'en-progreso', 'completado', 'cancelado');--> statement-breakpoint
CREATE TYPE "public"."estatus_recibo" AS ENUM('pendiente', 'pagado', 'vencido', 'cancelado');--> statement-breakpoint
CREATE TYPE "public"."periodicidad_pago" AS ENUM('mensual', 'bimestral', 'anual');--> statement-breakpoint
CREATE TYPE "public"."tipo_movimiento" AS ENUM('ingreso', 'gasto');--> statement-breakpoint
CREATE TYPE "public"."tipo_propiedad" AS ENUM('casa', 'departamento', 'local-comercial', 'bodega', 'otro');--> statement-breakpoint
CREATE TABLE "contratos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"propiedad_id" uuid NOT NULL,
	"inquilino_id" uuid NOT NULL,
	"fecha_inicio" date NOT NULL,
	"fecha_fin" date NOT NULL,
	"renta_mensual" numeric(12, 2) NOT NULL,
	"deposito" numeric(12, 2) DEFAULT '0' NOT NULL,
	"periodicidad_pago" "periodicidad_pago" DEFAULT 'mensual' NOT NULL,
	"estatus" "estatus_contrato" DEFAULT 'vigente' NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"creado_en" timestamp DEFAULT now() NOT NULL,
	"actualizada_en" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "facturas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recibo_id" uuid NOT NULL,
	"uuid" varchar(36),
	"folio_fiscal" varchar(50),
	"serie" varchar(10) NOT NULL,
	"folio" varchar(20) NOT NULL,
	"uso_cfdi" varchar(3) DEFAULT 'D10' NOT NULL,
	"estatus" varchar(20) DEFAULT 'pendiente' NOT NULL,
	"xml_path" varchar(500),
	"pdf_path" varchar(500),
	"timbrado_en" timestamp,
	"cancelado_en" timestamp,
	"creado_en" timestamp DEFAULT now() NOT NULL,
	"actualizada_en" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inquilinos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" varchar(100) NOT NULL,
	"apellido_paterno" varchar(100) NOT NULL,
	"apellido_materno" varchar(100) NOT NULL,
	"rfc" varchar(13),
	"curp" varchar(18),
	"telefono" varchar(15) NOT NULL,
	"correo" varchar(200),
	"activo" boolean DEFAULT true NOT NULL,
	"creado_en" timestamp DEFAULT now() NOT NULL,
	"actualizada_en" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mantenimientos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"propiedad_id" uuid NOT NULL,
	"categoria" "categoria_mantenimiento" NOT NULL,
	"descripcion" text NOT NULL,
	"costo" numeric(12, 2) DEFAULT '0' NOT NULL,
	"estatus" "estatus_mantenimiento" DEFAULT 'pendiente' NOT NULL,
	"reportado_por" varchar(200),
	"completado_en" timestamp,
	"creado_en" timestamp DEFAULT now() NOT NULL,
	"actualizada_en" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "movimientos_contables" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tipo" "tipo_movimiento" NOT NULL,
	"categoria" varchar(50) NOT NULL,
	"monto" numeric(12, 2) NOT NULL,
	"descripcion" text NOT NULL,
	"fecha" date NOT NULL,
	"propiedad_id" uuid,
	"contrato_id" uuid,
	"factura_id" uuid,
	"creado_en" timestamp DEFAULT now() NOT NULL,
	"actualizada_en" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "propiedades" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" varchar(200) NOT NULL,
	"calle" varchar(200) NOT NULL,
	"numero" varchar(20) NOT NULL,
	"colonia" varchar(100) NOT NULL,
	"codigo_postal" varchar(5) NOT NULL,
	"ciudad" varchar(100) NOT NULL,
	"estado" varchar(100) NOT NULL,
	"tipo" "tipo_propiedad" DEFAULT 'casa' NOT NULL,
	"activa" boolean DEFAULT true NOT NULL,
	"creada_en" timestamp DEFAULT now() NOT NULL,
	"actualizada_en" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recibos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contrato_id" uuid NOT NULL,
	"numero_recibo" varchar(30) NOT NULL,
	"periodo_inicio" date NOT NULL,
	"periodo_fin" date NOT NULL,
	"fecha_limite_pago" date NOT NULL,
	"renta" numeric(12, 2) NOT NULL,
	"otros_cobros" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total" numeric(12, 2) NOT NULL,
	"estatus" "estatus_recibo" DEFAULT 'pendiente' NOT NULL,
	"factura_id" uuid,
	"pagado_en" timestamp,
	"creado_en" timestamp DEFAULT now() NOT NULL,
	"actualizada_en" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "recibos_numero_recibo_unique" UNIQUE("numero_recibo")
);
--> statement-breakpoint
ALTER TABLE "contratos" ADD CONSTRAINT "contratos_propiedad_id_propiedades_id_fk" FOREIGN KEY ("propiedad_id") REFERENCES "public"."propiedades"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contratos" ADD CONSTRAINT "contratos_inquilino_id_inquilinos_id_fk" FOREIGN KEY ("inquilino_id") REFERENCES "public"."inquilinos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facturas" ADD CONSTRAINT "facturas_recibo_id_recibos_id_fk" FOREIGN KEY ("recibo_id") REFERENCES "public"."recibos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mantenimientos" ADD CONSTRAINT "mantenimientos_propiedad_id_propiedades_id_fk" FOREIGN KEY ("propiedad_id") REFERENCES "public"."propiedades"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movimientos_contables" ADD CONSTRAINT "movimientos_contables_propiedad_id_propiedades_id_fk" FOREIGN KEY ("propiedad_id") REFERENCES "public"."propiedades"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movimientos_contables" ADD CONSTRAINT "movimientos_contables_contrato_id_contratos_id_fk" FOREIGN KEY ("contrato_id") REFERENCES "public"."contratos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movimientos_contables" ADD CONSTRAINT "movimientos_contables_factura_id_facturas_id_fk" FOREIGN KEY ("factura_id") REFERENCES "public"."facturas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recibos" ADD CONSTRAINT "recibos_contrato_id_contratos_id_fk" FOREIGN KEY ("contrato_id") REFERENCES "public"."contratos"("id") ON DELETE no action ON UPDATE no action;