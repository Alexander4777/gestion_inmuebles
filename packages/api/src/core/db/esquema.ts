import {
  pgTable,
  uuid,
  varchar,
  text,
  numeric,
  integer,
  date,
  boolean,
  timestamp,
  jsonb,
  pgEnum,
} from 'drizzle-orm/pg-core';

// ── Enums ──────────────────────────────────────────────────────────────────────
export const tipoPropiedad = pgEnum('tipo_propiedad', [
  'casa',
  'departamento',
  'local-comercial',
  'bodega',
  'otro',
]);

export const estatusContrato = pgEnum('estatus_contrato', [
  'vigente',
  'proximo-a-vencer',
  'vencido',
  'terminado',
  'cancelado',
]);

export const periodicidadPago = pgEnum('periodicidad_pago', ['mensual', 'bimestral', 'anual']);

export const estatusRecibo = pgEnum('estatus_recibo', [
  'pendiente',
  'pagado',
  'vencido',
  'cancelado',
]);

export const categoriaMantenimiento = pgEnum('categoria_mantenimiento', [
  'electricidad',
  'fontaneria',
  'carpinteria',
  'albañileria',
  'materiales',
  'otro',
]);

export const estatusMantenimiento = pgEnum('estatus_mantenimiento', [
  'pendiente',
  'en-progreso',
  'completado',
  'cancelado',
]);

export const tipoMovimiento = pgEnum('tipo_movimiento', ['ingreso', 'gasto']);

// ── Tablas ─────────────────────────────────────────────────────────────────────

export const propiedades = pgTable('propiedades', {
  id: uuid('id').defaultRandom().primaryKey(),
  nombre: varchar('nombre', { length: 200 }).notNull(),
  calle: varchar('calle', { length: 200 }).notNull(),
  numero: varchar('numero', { length: 20 }).notNull(),
  colonia: varchar('colonia', { length: 100 }).notNull(),
  codigoPostal: varchar('codigo_postal', { length: 5 }).notNull(),
  ciudad: varchar('ciudad', { length: 100 }).notNull(),
  estado: varchar('estado', { length: 100 }).notNull(),
  tipo: tipoPropiedad('tipo').notNull().default('casa'),
  activa: boolean('activa').notNull().default(true),
  creadaEn: timestamp('creada_en').notNull().defaultNow(),
  actualizadaEn: timestamp('actualizada_en')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// Fotos asociadas a una propiedad. El archivo físico vive en disco
// (packages/api/data/propiedades/<propiedadId>/<nombre_archivo>) y se sirve
// vía express.static('/uploads'). La cascada al borrar la propiedad limpia
// las filas; los archivos se eliminan en el service.
export const propiedadFotos = pgTable('propiedad_fotos', {
  id: uuid('id').defaultRandom().primaryKey(),
  propiedadId: uuid('propiedad_id')
    .notNull()
    .references(() => propiedades.id, { onDelete: 'cascade' }),
  // Nombre en disco: <uuid>.<ext>. Nunca se usa el nombre original del
  // cliente para evitar path traversal y colisiones.
  nombreArchivo: varchar('nombre_archivo', { length: 255 }).notNull(),
  // Nombre que tenía el archivo en el cliente, para mostrar en UI.
  nombreOriginal: varchar('nombre_original', { length: 255 }).notNull(),
  mimeType: varchar('mime_type', { length: 50 }).notNull(),
  tamanoBytes: integer('tamano_bytes').notNull(),
  orden: integer('orden').notNull().default(0),
  esPortada: boolean('es_portada').notNull().default(false),
  subidaEn: timestamp('subida_en').notNull().defaultNow(),
});

export const inquilinos = pgTable('inquilinos', {
  id: uuid('id').defaultRandom().primaryKey(),
  nombre: varchar('nombre', { length: 100 }).notNull(),
  apellidoPaterno: varchar('apellido_paterno', { length: 100 }).notNull(),
  apellidoMaterno: varchar('apellido_materno', { length: 100 }).notNull(),
  rfc: varchar('rfc', { length: 13 }),
  curp: varchar('curp', { length: 18 }),
  telefono: varchar('telefono', { length: 15 }).notNull(),
  correo: varchar('correo', { length: 200 }),
  // Hash bcrypt. NULL = el inquilino aún no tiene cuenta en el portal.
  // El admin la establece vía POST /api/inquilinos/:id/cuenta.
  passwordHash: text('password_hash'),
  activo: boolean('activo').notNull().default(true),
  creadoEn: timestamp('creado_en').notNull().defaultNow(),
  actualizadoEn: timestamp('actualizada_en')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const contratos = pgTable('contratos', {
  id: uuid('id').defaultRandom().primaryKey(),
  propiedadId: uuid('propiedad_id')
    .notNull()
    .references(() => propiedades.id),
  inquilinoId: uuid('inquilino_id')
    .notNull()
    .references(() => inquilinos.id),
  fechaInicio: date('fecha_inicio').notNull(),
  fechaFin: date('fecha_fin').notNull(),
  rentaMensual: numeric('renta_mensual', { precision: 12, scale: 2 }).notNull(),
  deposito: numeric('deposito', { precision: 12, scale: 2 }).notNull().default('0'),
  periodicidadPago: periodicidadPago('periodicidad_pago').notNull().default('mensual'),
  estatus: estatusContrato('estatus').notNull().default('vigente'),
  activo: boolean('activo').notNull().default(true),
  creadoEn: timestamp('creado_en').notNull().defaultNow(),
  actualizadoEn: timestamp('actualizada_en')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const recibos = pgTable('recibos', {
  id: uuid('id').defaultRandom().primaryKey(),
  contratoId: uuid('contrato_id')
    .notNull()
    .references(() => contratos.id),
  numeroRecibo: varchar('numero_recibo', { length: 30 }).notNull().unique(),
  periodoInicio: date('periodo_inicio').notNull(),
  periodoFin: date('periodo_fin').notNull(),
  fechaLimitePago: date('fecha_limite_pago').notNull(),
  renta: numeric('renta', { precision: 12, scale: 2 }).notNull(),
  otrosCobros: numeric('otros_cobros', { precision: 12, scale: 2 }).notNull().default('0'),
  total: numeric('total', { precision: 12, scale: 2 }).notNull(),
  estatus: estatusRecibo('estatus').notNull().default('pendiente'),
  facturaId: uuid('factura_id'),
  pagadoEn: timestamp('pagado_en'),
  creadoEn: timestamp('creado_en').notNull().defaultNow(),
  actualizadoEn: timestamp('actualizada_en')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const facturas = pgTable('facturas', {
  id: uuid('id').defaultRandom().primaryKey(),
  reciboId: uuid('recibo_id')
    .notNull()
    .references(() => recibos.id),
  uuid: varchar('uuid', { length: 36 }),
  folioFiscal: varchar('folio_fiscal', { length: 50 }),
  serie: varchar('serie', { length: 10 }).notNull(),
  folio: varchar('folio', { length: 20 }).notNull(),
  usoCFDI: varchar('uso_cfdi', { length: 3 }).notNull().default('D10'),
  estatus: varchar('estatus', { length: 20 }).notNull().default('pendiente'),
  xmlPath: varchar('xml_path', { length: 500 }),
  pdfPath: varchar('pdf_path', { length: 500 }),
  timbradoEn: timestamp('timbrado_en'),
  canceladoEn: timestamp('cancelado_en'),
  creadoEn: timestamp('creado_en').notNull().defaultNow(),
  actualizadoEn: timestamp('actualizada_en')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const mantenimientos = pgTable('mantenimientos', {
  id: uuid('id').defaultRandom().primaryKey(),
  propiedadId: uuid('propiedad_id')
    .notNull()
    .references(() => propiedades.id),
  categoria: categoriaMantenimiento('categoria').notNull(),
  descripcion: text('descripcion').notNull(),
  costo: numeric('costo', { precision: 12, scale: 2 }).notNull().default('0'),
  estatus: estatusMantenimiento('estatus').notNull().default('pendiente'),
  reportadoPor: varchar('reportado_por', { length: 200 }),
  completadoEn: timestamp('completado_en'),
  creadoEn: timestamp('creado_en').notNull().defaultNow(),
  actualizadoEn: timestamp('actualizada_en')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const movimientosContables = pgTable('movimientos_contables', {
  id: uuid('id').defaultRandom().primaryKey(),
  tipo: tipoMovimiento('tipo').notNull(),
  categoria: varchar('categoria', { length: 50 }).notNull(),
  monto: numeric('monto', { precision: 12, scale: 2 }).notNull(),
  descripcion: text('descripcion').notNull(),
  fecha: date('fecha').notNull(),
  propiedadId: uuid('propiedad_id').references(() => propiedades.id),
  contratoId: uuid('contrato_id').references(() => contratos.id),
  facturaId: uuid('factura_id').references(() => facturas.id),
  creadoEn: timestamp('creado_en').notNull().defaultNow(),
  actualizadoEn: timestamp('actualizada_en')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// ── IA: Predicciones ────────────────────────────────────────────────────────────
export const predicciones = pgTable('predicciones', {
  id: uuid('id').defaultRandom().primaryKey(),
  tipo: varchar('tipo', { length: 30 }).notNull(),
  objetivoTipo: varchar('objetivo_tipo', { length: 30 }).notNull(),
  objetivoId: uuid('objetivo_id').notNull(),
  probabilidad: numeric('probabilidad', { precision: 5, scale: 4 }),
  valorEstimado: numeric('valor_estimado', { precision: 12, scale: 2 }),
  featureImportance: jsonb('feature_importance'),
  modeloVersion: varchar('modelo_version', { length: 20 }).notNull(),
  calculadaEn: timestamp('calculada_en').notNull().defaultNow(),
});
