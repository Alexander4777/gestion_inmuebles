CREATE TABLE "predicciones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tipo" varchar(30) NOT NULL,
	"objetivo_tipo" varchar(30) NOT NULL,
	"objetivo_id" uuid NOT NULL,
	"probabilidad" numeric(5, 4),
	"valor_estimado" numeric(12, 2),
	"feature_importance" jsonb,
	"modelo_version" varchar(20) NOT NULL,
	"calculada_en" timestamp DEFAULT now() NOT NULL
);
