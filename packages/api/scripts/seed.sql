-- =============================================================================
-- Seed SQL — datos de prueba para proyecto_modular
-- =============================================================================
--
-- PROPÓSITO:
--   Alternativa SQL puro al seed TypeScript (scripts/seed.ts) para entornos
--   donde psql es más cómodo que tsx. Mismo dominio, datos más ricos:
--     - 8 propiedades en 5 ciudades
--     - 12 inquilinos (incluye "moroso" para entrenar IA)
--     - 10 contratos con todos los estatus representados
--     - ~50 recibos (pagados, pendientes, vencidos, cancelados)
--     - 12 mantenimientos (pendientes/en-progreso/completados)
--     - 30 movimientos contables cruzados
--     - 5 facturas timbradas
--
-- CÓMO EJECUTAR:
--   psql $DATABASE_URL -f packages/api/scripts/seed.sql
--
-- IDEMPOTENCIA:
--   Limpia TODAS las tablas de dominio antes de insertar. NO usar en prod.
--
-- CASOS DE PRUEBA CUBIERTOS:
--   • Login: admin/admin123 (no requiere tabla usuarios — está hardcoded en auth.router.ts)
--   • Morosidad: 5 recibos marcados 'vencido' + 1 inquilino con RFC prefijo MORA
--   • Vacancia: 1 contrato 'terminado' antes de fechaFin
--   • Mantenimiento: mix de categorías/estatus para feature engineering
--   • Facturación: 5 facturas timbradas (usoCFDI D10 = arrendamiento)
--   • Estado de resultados: ingresos cruzados con gastos deducibles
--
-- =============================================================================

BEGIN;

-- ── Limpieza (orden importa por FKs) ──────────────────────────────────────────
--
-- Un solo TRUNCATE con CASCADE limpia toda la dependencia circular
-- (movimientos_contables ↔ contratos ↔ recibos ↔ facturas ↔ propiedades ↔ inquilinos).
-- PostgreSQL rechaza TRUNCATE por separado cuando quedan FKs salientes hacia tablas con datos.

TRUNCATE TABLE
  predicciones,
  movimientos_contables,
  facturas,
  recibos,
  mantenimientos,
  contratos,
  inquilinos,
  propiedades
RESTART IDENTITY CASCADE;

-- ── 8 Propiedades (5 ciudades) ───────────────────────────────────────────────

INSERT INTO propiedades (id, nombre, calle, numero, colonia, codigo_postal, ciudad, estado, tipo, activa) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Casa Roma Norte',           'Av. Álvaro Obregón', '155', 'Roma Norte',    '06700', 'Ciudad de México', 'CDMX',         'casa',            true),
  ('22222222-2222-2222-2222-222222222222', 'Depto Polanco',             'Calle Anatole France', '42', 'Polanco',     '11550', 'Ciudad de México', 'CDMX',         'departamento',    true),
  ('33333333-3333-3333-3333-333333333333', 'Local Centro Histórico',   'Av. 5 de Mayo',      '88',  'Centro',        '06000', 'Ciudad de México', 'CDMX',         'local-comercial', true),
  ('44444444-4444-4444-4444-444444444444', 'Casa Providencia GDL',      'Av. Américas',       '450', 'Providencia',   '44630', 'Guadalajara',      'Jalisco',      'casa',            true),
  ('55555555-5555-5555-5555-555555555555', 'Depto Valle Oriente MTY',   'Av. Lázaro Cárdenas', '2400','Valle Oriente', '66269', 'Monterrey',        'Nuevo León',   'departamento',    true),
  ('66666666-6666-6666-6666-666666666666', 'Bodega San Pedro',          'Calle Industriales',  '12',  'San Pedro',     '52140', 'Toluca',           'Estado de México','bodega',      true),
  ('77777777-7777-7777-7777-777777777777', 'Depto Angelópolis PUE',     'Blvd. Niño Poblano', '2521','Angelópolis',   '72190', 'Puebla',           'Puebla',       'departamento',    true),
  ('88888888-8888-8888-8888-888888888888', 'Casa Cumbres QRO',          'Av. Paseo de la República','14560','Cumbres','76240', 'Querétaro',     'Querétaro',     'casa',            true);

-- ── 12 Inquilinos (incluye "moroso" para IA) ─────────────────────────────────

INSERT INTO inquilinos (id, nombre, apellido_paterno, apellido_materno, rfc, curp, telefono, correo, activo) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Ana María',      'Hernández', 'López',    'HEHA850301AAA', 'HEHA850301MDFRPN09', '5512345678', 'ana.hernandez@example.com',  true),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Luis Carlos',    'Martínez',  'García',   'MAGL900215ABC', 'MAGL900215HDFRRS03', '5523456789', 'luis.martinez@example.com',  true),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Patricia',        'González',  'Pérez',    'GOPA880612DEF', 'GOPA880612MDFNRT07', '5534567890', 'patricia.gonzalez@example.com', true),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Miguel Ángel',    'Ramírez',   'Torres',   'RATM920920GHI', 'RATM920920HDFMRG01', '5545678901', 'miguel.ramirez@example.com',  true),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Sofía',           'Flores',    'Rivera',   'FLRS870422JKL', 'FLRS870422MDFLVF02', '5556789012', 'sofia.flores@example.com',    true),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Juan Pablo',      'Díaz',      'Morales',  'DIMJ860810MNO', 'DIMJ860810HDFZRN08', '5567890123', 'juan.diaz@example.com',       true),
  -- Este es el "moroso": RFC con prefijo MORA para que el modelo lo identifique
  ('99999999-9999-9999-9999-999999999999', 'Roberto Carlos', 'Mora',      'Aguilar',  'MOAR830612PQR', 'MOAR830612HDFRGB04', '5578901234', 'roberto.mora@example.com',    true),
  ('88888888-8888-8888-8888-888888888881', 'Carmen',          'Vargas',    'Cruz',     'VACC910115STU', 'VACC910115MDFGRR05', '5589012345', 'carmen.vargas@example.com',   true),
  ('88888888-8888-8888-8888-888888888882', 'Francisco Javier','Castillo',  'Ortiz',    'CAOF890720VWX', 'CAOF890720HDFSRC06', '5590123456', 'francisco.castillo@example.com', true),
  ('88888888-8888-8888-8888-888888888883', 'Lucía',           'Reyes',     'Romero',   'RERL930412YZA', 'RERL930412MDFYMC00', '5501234567', 'lucia.reyes@example.com',     true),
  ('88888888-8888-8888-8888-888888888884', 'Manuel',          'Gómez',     'Sánchez',  'GOSM880920BCD', 'GOSM880920HDFMNN09', '5512345679', 'manuel.gomez@example.com',    true),
  ('88888888-8888-8888-8888-888888888885', 'Isabel',          'Cruz',      'Hernández','CUHI950308EFG', 'CUHI950308MDFRRS05', '5523456780', 'isabel.cruz@example.com',     true);

-- ── 10 Contratos (variedad de estatus) ───────────────────────────────────────

INSERT INTO contratos (id, propiedad_id, inquilino_id, fecha_inicio, fecha_fin, renta_mensual, deposito, periodicidad_pago, estatus, activo) VALUES
  -- 4 vigentes
  ('c0000001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '2026-01-15', '2027-01-14', 18000.00, 18000.00, 'mensual', 'vigente', true),
  ('c0000001-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '2026-02-01', '2027-01-31', 28000.00, 28000.00, 'mensual', 'vigente', true),
  ('c0000001-0000-0000-0000-000000000003', '44444444-4444-4444-4444-444444444444', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '2026-03-01', '2026-09-01', 14000.00, 14000.00, 'mensual', 'vigente', true),
  ('c0000001-0000-0000-0000-000000000004', '77777777-7777-7777-7777-777777777777', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '2026-04-01', '2026-10-01', 11500.00, 11500.00, 'mensual', 'vigente', true),

  -- 2 próximos a vencer (fechaFin < 60 días desde hoy)
  ('c0000001-0000-0000-0000-000000000005', '55555555-5555-5555-5555-555555555555', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '2025-09-01', '2026-08-31', 22000.00, 22000.00, 'mensual', 'proximo-a-vencer', true),
  ('c0000001-0000-0000-0000-000000000006', '88888888-8888-8888-8888-888888888888', 'ffffffff-ffff-ffff-ffff-ffffffffffff', '2025-08-15', '2026-08-14', 26000.00, 26000.00, 'mensual', 'proximo-a-vencer', true),

  -- 1 vencido (fechaFin en el pasado, no renovado)
  ('c0000001-0000-0000-0000-000000000007', '66666666-6666-6666-6666-666666666666', '88888888-8888-8888-8888-888888888881', '2025-01-01', '2025-12-31', 19000.00, 19000.00, 'mensual', 'vencido', false),

  -- 2 terminados (1 normal, 1 anticipado — este último entrena el modelo de vacancia)
  ('c0000001-0000-0000-0000-000000000008', '11111111-1111-1111-1111-111111111111', '88888888-8888-8888-8888-888888888882', '2024-06-01', '2025-05-31', 16500.00, 16500.00, 'mensual', 'terminado', false),
  -- Terminación anticipada: actualizado_en antes de fechaFin
  ('c0000001-0000-0000-0000-000000000009', '33333333-3333-3333-3333-333333333333', '88888888-8888-8888-8888-888888888883', '2025-01-15', '2025-12-14', 32000.00, 32000.00, 'mensual', 'terminado', false),

  -- 1 con el inquilino "moroso" (debe tener varios recibos vencidos)
  ('c0000001-0000-0000-0000-000000000010', '22222222-2222-2222-2222-222222222222', '99999999-9999-9999-9999-999999999999', '2025-06-01', '2026-05-31', 24000.00, 24000.00, 'mensual', 'vigente', true);

-- Forzar actualizado_en en contrato terminado anticipadamente (para que la feature lo detecte)
UPDATE contratos SET actualizada_en = '2025-08-15 12:00:00'::timestamp
  WHERE id = 'c0000001-0000-0000-0000-000000000009';

-- ── ~50 Recibos (mix de estatus) ─────────────────────────────────────────────

-- Contrato 1: 6 recibos pagados a tiempo (Ana María — buen comportamiento)
INSERT INTO recibos (contrato_id, numero_recibo, periodo_inicio, periodo_fin, fecha_limite_pago, renta, otros_cobros, total, estatus, pagado_en) VALUES
  ('c0000001-0000-0000-0000-000000000001', 'REC-2026-0001', '2026-01-01', '2026-01-31', '2026-02-05', 18000, 0,    18000, 'pagado', '2026-02-03 14:30:00'),
  ('c0000001-0000-0000-0000-000000000001', 'REC-2026-0002', '2026-02-01', '2026-02-28', '2026-03-05', 18000, 0,    18000, 'pagado', '2026-03-04 10:15:00'),
  ('c0000001-0000-0000-0000-000000000001', 'REC-2026-0003', '2026-03-01', '2026-03-31', '2026-04-05', 18000, 0,    18000, 'pagado', '2026-04-02 09:45:00'),
  ('c0000001-0000-0000-0000-000000000001', 'REC-2026-0004', '2026-04-01', '2026-04-30', '2026-05-05', 18000, 0,    18000, 'pagado', '2026-05-04 16:00:00'),
  ('c0000001-0000-0000-0000-000000000001', 'REC-2026-0005', '2026-05-01', '2026-05-31', '2026-06-05', 18000, 0,    18000, 'pagado', '2026-06-03 11:30:00'),
  ('c0000001-0000-0000-0000-000000000001', 'REC-2026-0006', '2026-06-01', '2026-06-30', '2026-07-05', 18000, 0,    18000, 'pagado', '2026-07-04 13:00:00'),
  ('c0000001-0000-0000-0000-000000000001', 'REC-2026-0007', '2026-07-01', '2026-07-31', '2026-08-05', 18000, 0,    18000, 'pendiente', NULL);

-- Contrato 2: 5 pagados + 1 pendiente (Luis Carlos)
INSERT INTO recibos (contrato_id, numero_recibo, periodo_inicio, periodo_fin, fecha_limite_pago, renta, otros_cobros, total, estatus, pagado_en) VALUES
  ('c0000001-0000-0000-0000-000000000002', 'REC-2026-0010', '2026-02-01', '2026-02-28', '2026-03-05', 28000, 0,    28000, 'pagado', '2026-03-05 18:00:00'),
  ('c0000001-0000-0000-0000-000000000002', 'REC-2026-0011', '2026-03-01', '2026-03-31', '2026-04-05', 28000, 0,    28000, 'pagado', '2026-04-05 12:30:00'),
  ('c0000001-0000-0000-0000-000000000002', 'REC-2026-0012', '2026-04-01', '2026-04-30', '2026-05-05', 28000, 0,    28000, 'pagado', '2026-05-05 19:00:00'),
  ('c0000001-0000-0000-0000-000000000002', 'REC-2026-0013', '2026-05-01', '2026-05-31', '2026-06-05', 28000, 0,    28000, 'pagado', '2026-06-05 17:45:00'),
  ('c0000001-0000-0000-0000-000000000002', 'REC-2026-0014', '2026-06-01', '2026-06-30', '2026-07-05', 28000, 0,    28000, 'pagado', '2026-07-05 20:00:00'),
  ('c0000001-0000-0000-0000-000000000002', 'REC-2026-0015', '2026-07-01', '2026-07-31', '2026-08-05', 28000, 0,    28000, 'pendiente', NULL);

-- Contrato 3: 3 pagados (Patricia)
INSERT INTO recibos (contrato_id, numero_recibo, periodo_inicio, periodo_fin, fecha_limite_pago, renta, otros_cobros, total, estatus, pagado_en) VALUES
  ('c0000001-0000-0000-0000-000000000003', 'REC-2026-0020', '2026-03-01', '2026-03-31', '2026-04-05', 14000, 0, 14000, 'pagado', '2026-04-01 10:00:00'),
  ('c0000001-0000-0000-0000-000000000003', 'REC-2026-0021', '2026-04-01', '2026-04-30', '2026-05-05', 14000, 0, 14000, 'pagado', '2026-05-02 11:00:00'),
  ('c0000001-0000-0000-0000-000000000003', 'REC-2026-0022', '2026-05-01', '2026-05-31', '2026-06-05', 14000, 0, 14000, 'pagado', '2026-06-03 09:30:00'),
  ('c0000001-0000-0000-0000-000000000003', 'REC-2026-0023', '2026-06-01', '2026-06-30', '2026-07-05', 14000, 0, 14000, 'pagado', '2026-07-04 14:20:00'),
  ('c0000001-0000-0000-0000-000000000003', 'REC-2026-0024', '2026-07-01', '2026-07-31', '2026-08-05', 14000, 0, 14000, 'pendiente', NULL);

-- Contrato 4: 3 pagados (Sofía)
INSERT INTO recibos (contrato_id, numero_recibo, periodo_inicio, periodo_fin, fecha_limite_pago, renta, otros_cobros, total, estatus, pagado_en) VALUES
  ('c0000001-0000-0000-0000-000000000004', 'REC-2026-0030', '2026-04-01', '2026-04-30', '2026-05-05', 11500, 0, 11500, 'pagado', '2026-05-05 13:00:00'),
  ('c0000001-0000-0000-0000-000000000004', 'REC-2026-0031', '2026-05-01', '2026-05-31', '2026-06-05', 11500, 0, 11500, 'pagado', '2026-06-04 15:30:00'),
  ('c0000001-0000-0000-0000-000000000004', 'REC-2026-0032', '2026-06-01', '2026-06-30', '2026-07-05', 11500, 0, 11500, 'pagado', '2026-07-03 16:45:00'),
  ('c0000001-0000-0000-0000-000000000004', 'REC-2026-0033', '2026-07-01', '2026-07-31', '2026-08-05', 11500, 0, 11500, 'pendiente', NULL);

-- Contrato 5: varios pagados y 1 vencido (Miguel Ángel)
INSERT INTO recibos (contrato_id, numero_recibo, periodo_inicio, periodo_fin, fecha_limite_pago, renta, otros_cobros, total, estatus, pagado_en) VALUES
  ('c0000001-0000-0000-0000-000000000005', 'REC-2025-0100', '2025-09-01', '2025-09-30', '2025-10-05', 22000, 0, 22000, 'pagado', '2025-10-02 10:00:00'),
  ('c0000001-0000-0000-0000-000000000005', 'REC-2025-0101', '2025-10-01', '2025-10-31', '2025-11-05', 22000, 0, 22000, 'pagado', '2025-11-04 11:30:00'),
  ('c0000001-0000-0000-0000-000000000005', 'REC-2025-0102', '2025-11-01', '2025-11-30', '2025-12-05', 22000, 0, 22000, 'pagado', '2025-12-03 09:00:00'),
  ('c0000001-0000-0000-0000-000000000005', 'REC-2025-0103', '2025-12-01', '2025-12-31', '2026-01-05', 22000, 0, 22000, 'pagado', '2026-01-04 14:00:00'),
  ('c0000001-0000-0000-0000-000000000005', 'REC-2026-0104', '2026-01-01', '2026-01-31', '2026-02-05', 22000, 0, 22000, 'pagado', '2026-02-05 17:30:00'),
  ('c0000001-0000-0000-0000-000000000005', 'REC-2026-0105', '2026-02-01', '2026-02-28', '2026-03-05', 22000, 0, 22000, 'vencido', NULL),
  ('c0000001-0000-0000-0000-000000000005', 'REC-2026-0106', '2026-03-01', '2026-03-31', '2026-04-05', 22000, 0, 22000, 'vencido', NULL),
  ('c0000001-0000-0000-0000-000000000005', 'REC-2026-0107', '2026-04-01', '2026-04-30', '2026-05-05', 22000, 0, 22000, 'vencido', NULL),
  ('c0000001-0000-0000-0000-000000000005', 'REC-2026-0108', '2026-05-01', '2026-05-31', '2026-06-05', 22000, 0, 22000, 'vencido', NULL),
  ('c0000001-0000-0000-0000-000000000005', 'REC-2026-0109', '2026-06-01', '2026-06-30', '2026-07-05', 22000, 0, 22000, 'vencido', NULL),
  ('c0000001-0000-0000-0000-000000000005', 'REC-2026-0110', '2026-07-01', '2026-07-31', '2026-08-05', 22000, 0, 22000, 'pendiente', NULL);

-- Contrato 6: pagados + 1 cancelado (Juan Pablo)
INSERT INTO recibos (contrato_id, numero_recibo, periodo_inicio, periodo_fin, fecha_limite_pago, renta, otros_cobros, total, estatus, pagado_en) VALUES
  ('c0000001-0000-0000-0000-000000000006', 'REC-2025-0200', '2025-08-01', '2025-08-31', '2025-09-05', 26000, 0, 26000, 'pagado', '2025-09-04 12:00:00'),
  ('c0000001-0000-0000-0000-000000000006', 'REC-2025-0201', '2025-09-01', '2025-09-30', '2025-10-05', 26000, 0, 26000, 'pagado', '2025-10-03 13:00:00'),
  ('c0000001-0000-0000-0000-000000000006', 'REC-2025-0202', '2025-10-01', '2025-10-31', '2025-11-05', 26000, 0, 26000, 'pagado', '2025-11-05 10:30:00'),
  ('c0000001-0000-0000-0000-000000000006', 'REC-2025-0203', '2025-11-01', '2025-11-30', '2025-12-05', 26000, 0, 26000, 'cancelado', NULL),
  ('c0000001-0000-0000-0000-000000000006', 'REC-2026-0204', '2026-01-01', '2026-01-31', '2026-02-05', 26000, 0, 26000, 'pagado', '2026-02-04 11:00:00'),
  ('c0000001-0000-0000-0000-000000000006', 'REC-2026-0205', '2026-02-01', '2026-02-28', '2026-03-05', 26000, 0, 26000, 'pagado', '2026-03-03 14:30:00'),
  ('c0000001-0000-0000-0000-000000000006', 'REC-2026-0206', '2026-03-01', '2026-03-31', '2026-04-05', 26000, 0, 26000, 'pagado', '2026-04-04 16:00:00'),
  ('c0000001-0000-0000-0000-000000000006', 'REC-2026-0207', '2026-04-01', '2026-04-30', '2026-05-05', 26000, 0, 26000, 'pagado', '2026-05-04 18:30:00'),
  ('c0000001-0000-0000-0000-000000000006', 'REC-2026-0208', '2026-05-01', '2026-05-31', '2026-06-05', 26000, 0, 26000, 'pagado', '2026-06-05 19:00:00'),
  ('c0000001-0000-0000-0000-000000000006', 'REC-2026-0209', '2026-06-01', '2026-06-30', '2026-07-05', 26000, 0, 26000, 'pagado', '2026-07-04 20:00:00'),
  ('c0000001-0000-0000-0000-000000000006', 'REC-2026-0210', '2026-07-01', '2026-07-31', '2026-08-05', 26000, 0, 26000, 'pendiente', NULL);

-- Contrato 10: INQUILINO MOROSO — varios vencidos para entrenar el modelo
INSERT INTO recibos (contrato_id, numero_recibo, periodo_inicio, periodo_fin, fecha_limite_pago, renta, otros_cobros, total, estatus, pagado_en) VALUES
  ('c0000001-0000-0000-0000-000000000010', 'REC-2025-0300', '2025-06-01', '2025-06-30', '2025-07-05', 24000, 0, 24000, 'pagado',   '2025-07-04 18:00:00'),
  ('c0000001-0000-0000-0000-000000000010', 'REC-2025-0301', '2025-07-01', '2025-07-31', '2025-08-05', 24000, 0, 24000, 'vencido',  NULL),
  ('c0000001-0000-0000-0000-000000000010', 'REC-2025-0302', '2025-08-01', '2025-08-31', '2025-09-05', 24000, 0, 24000, 'vencido',  NULL),
  ('c0000001-0000-0000-0000-000000000010', 'REC-2025-0303', '2025-09-01', '2025-09-30', '2025-10-05', 24000, 0, 24000, 'vencido',  NULL),
  ('c0000001-0000-0000-0000-000000000010', 'REC-2025-0304', '2025-10-01', '2025-10-31', '2025-11-05', 24000, 0, 24000, 'vencido',  NULL),
  ('c0000001-0000-0000-0000-000000000010', 'REC-2025-0305', '2025-11-01', '2025-11-30', '2025-12-05', 24000, 0, 24000, 'vencido',  NULL),
  ('c0000001-0000-0000-0000-000000000010', 'REC-2025-0306', '2025-12-01', '2025-12-31', '2026-01-05', 24000, 0, 24000, 'vencido',  NULL),
  ('c0000001-0000-0000-0000-000000000010', 'REC-2026-0307', '2026-01-01', '2026-01-31', '2026-02-05', 24000, 0, 24000, 'vencido',  NULL),
  ('c0000001-0000-0000-0000-000000000010', 'REC-2026-0308', '2026-02-01', '2026-02-28', '2026-03-05', 24000, 0, 24000, 'vencido',  NULL),
  ('c0000001-0000-0000-0000-000000000010', 'REC-2026-0309', '2026-03-01', '2026-03-31', '2026-04-05', 24000, 0, 24000, 'vencido',  NULL),
  ('c0000001-0000-0000-0000-000000000010', 'REC-2026-0310', '2026-04-01', '2026-04-30', '2026-05-05', 24000, 0, 24000, 'vencido',  NULL),
  ('c0000001-0000-0000-0000-000000000010', 'REC-2026-0311', '2026-05-01', '2026-05-31', '2026-06-05', 24000, 0, 24000, 'vencido',  NULL),
  ('c0000001-0000-0000-0000-000000000010', 'REC-2026-0312', '2026-06-01', '2026-06-30', '2026-07-05', 24000, 0, 24000, 'vencido',  NULL),
  ('c0000001-0000-0000-0000-000000000010', 'REC-2026-0313', '2026-07-01', '2026-07-31', '2026-08-05', 24000, 0, 24000, 'pendiente', NULL);

-- ── 12 Mantenimientos (variedad para entrenar) ───────────────────────────────

INSERT INTO mantenimientos (propiedad_id, categoria, descripcion, costo, estatus, reportado_por, creado_en, completado_en) VALUES
  -- Casa Roma: propensa a fallas (3 mantenimientos en <12 meses)
  ('11111111-1111-1111-1111-111111111111', 'electricidad', 'Cambio de interruptor y revisión de contactos',                1200, 'completado', 'Inquilino', '2026-01-15 10:00:00', '2026-01-20 15:00:00'),
  ('11111111-1111-1111-1111-111111111111', 'fontaneria',   'Reparación de fuga en lavabo de baño principal',                850,  'completado', 'Inquilino', '2026-03-10 09:30:00', '2026-03-15 14:00:00'),
  ('11111111-1111-1111-1111-111111111111', 'albañileria',  'Resane de grieta en techo por filtración',                       3400, 'completado', 'Administrador','2026-05-22 11:00:00','2026-06-08 16:30:00'),

  -- Depto Polanco: estable (1 mantenimiento)
  ('22222222-2222-2222-2222-222222222222', 'carpinteria',  'Ajuste de puertas de clóset',                                     600,  'completado', 'Inquilino', '2026-04-05 12:00:00', '2026-04-12 13:30:00'),

  -- Casa Providencia: estable (1 mantenimiento reciente)
  ('44444444-4444-4444-4444-444444444444', 'electricidad', 'Mantenimiento preventivo de tablero eléctrico',                 1500, 'completado', 'Administrador','2026-02-18 10:00:00','2026-02-25 11:00:00'),

  -- Depto Valle Oriente: 1 en progreso, 1 pendiente
  ('55555555-5555-5555-5555-555555555555', 'fontaneria',   'Cambio de termostato de regadera',                                 980,  'en-progreso', 'Inquilino', '2026-07-20 08:30:00', NULL),
  ('55555555-5555-5555-5555-555555555555', 'materiales',   'Adquisición de sellador y piezas de fontanería',                  450,  'pendiente',  'Administrador','2026-07-28 09:00:00', NULL),

  -- Local Centro: 1 completado (negocio cerrado temporalmente)
  ('33333333-3333-3333-3333-333333333333', 'electricidad', 'Re-certificación de instalación eléctrica',                       4200, 'completado', 'Administrador','2026-06-01 08:00:00','2026-06-15 17:00:00'),

  -- Casa Cumbres: 2 pendientes (recién entregado al inquilino)
  ('88888888-8888-8888-8888-888888888888', 'carpinteria',  'Instalación de persianas en recámaras',                          2800, 'pendiente',  'Inquilino', '2026-07-25 14:00:00', NULL),
  -- 'pintura' no existe en el enum categoria_mantenimiento → 'otro'
  ('88888888-8888-8888-8888-888888888888', 'otro',         'Pintura de fachada exterior',                                     8500, 'pendiente',  'Administrador','2026-07-30 10:00:00', NULL),

  -- Depto Angelópolis: mix
  ('77777777-7777-7777-7777-777777777777', 'otro',         'Limpieza profunda de alfombras',                                   900,  'completado', 'Inquilino', '2026-05-12 11:00:00', '2026-05-15 13:00:00'),
  ('77777777-7777-7777-7777-777777777777', 'fontaneria',   'Destape de drenaje de cocina',                                     700,  'completado', 'Inquilino', '2026-07-02 16:00:00', '2026-07-05 18:00:00');

-- ── 30 Movimientos contables ─────────────────────────────────────────────────

INSERT INTO movimientos_contables (tipo, categoria, monto, descripcion, fecha, propiedad_id, contrato_id) VALUES
  -- Ingresos por renta (cruzados con contratos)
  ('ingreso', 'renta',          18000, 'Renta enero — Casa Roma',         '2026-02-03', '11111111-1111-1111-1111-111111111111', 'c0000001-0000-0000-0000-000000000001'),
  ('ingreso', 'renta',          18000, 'Renta febrero — Casa Roma',        '2026-03-04', '11111111-1111-1111-1111-111111111111', 'c0000001-0000-0000-0000-000000000001'),
  ('ingreso', 'renta',          18000, 'Renta marzo — Casa Roma',          '2026-04-02', '11111111-1111-1111-1111-111111111111', 'c0000001-0000-0000-0000-000000000001'),
  ('ingreso', 'renta',          18000, 'Renta abril — Casa Roma',          '2026-05-04', '11111111-1111-1111-1111-111111111111', 'c0000001-0000-0000-0000-000000000001'),
  ('ingreso', 'renta',          18000, 'Renta mayo — Casa Roma',           '2026-06-03', '11111111-1111-1111-1111-111111111111', 'c0000001-0000-0000-0000-000000000001'),
  ('ingreso', 'renta',          18000, 'Renta junio — Casa Roma',          '2026-07-04', '11111111-1111-1111-1111-111111111111', 'c0000001-0000-0000-0000-000000000001'),
  ('ingreso', 'renta',          28000, 'Renta febrero — Depto Polanco',    '2026-03-05', '22222222-2222-2222-2222-222222222222', 'c0000001-0000-0000-0000-000000000002'),
  ('ingreso', 'renta',          28000, 'Renta marzo — Depto Polanco',      '2026-04-05', '22222222-2222-2222-2222-222222222222', 'c0000001-0000-0000-0000-000000000002'),
  ('ingreso', 'renta',          28000, 'Renta abril — Depto Polanco',      '2026-05-05', '22222222-2222-2222-2222-222222222222', 'c0000001-0000-0000-0000-000000000002'),
  ('ingreso', 'renta',          28000, 'Renta mayo — Depto Polanco',       '2026-06-05', '22222222-2222-2222-2222-222222222222', 'c0000001-0000-0000-0000-000000000002'),
  ('ingreso', 'renta',          28000, 'Renta junio — Depto Polanco',      '2026-07-05', '22222222-2222-2222-2222-222222222222', 'c0000001-0000-0000-0000-000000000002'),
  ('ingreso', 'renta',          14000, 'Renta marzo — Casa Providencia',   '2026-04-01', '44444444-4444-4444-4444-444444444444', 'c0000001-0000-0000-0000-000000000003'),
  ('ingreso', 'renta',          14000, 'Renta abril — Casa Providencia',   '2026-05-02', '44444444-4444-4444-4444-444444444444', 'c0000001-0000-0000-0000-000000000003'),
  ('ingreso', 'renta',          14000, 'Renta mayo — Casa Providencia',    '2026-06-03', '44444444-4444-4444-4444-444444444444', 'c0000001-0000-0000-0000-000000000003'),
  ('ingreso', 'renta',          14000, 'Renta junio — Casa Providencia',   '2026-07-04', '44444444-4444-4444-4444-444444444444', 'c0000001-0000-0000-0000-000000000003'),
  ('ingreso', 'renta',          22000, 'Renta enero — Depto Valle Or.',    '2026-02-05', '55555555-5555-5555-5555-555555555555', 'c0000001-0000-0000-0000-000000000005'),
  ('ingreso', 'deposito',       11500, 'Depósito inicial — Depto Angelópolis', '2026-04-01', '77777777-7777-7777-7777-777777777777', 'c0000001-0000-0000-0000-000000000004'),

  -- Gastos deducibles (mix de categorías — alimenta el reporte fiscal)
  ('gasto', 'luz',                     850, 'CFE — Casa Roma enero',                 '2026-02-10', '11111111-1111-1111-1111-111111111111', NULL),
  ('gasto', 'luz',                     920, 'CFE — Casa Roma febrero',               '2026-03-12', '11111111-1111-1111-1111-111111111111', NULL),
  ('gasto', 'luz',                     890, 'CFE — Casa Roma marzo',                 '2026-04-11', '11111111-1111-1111-1111-111111111111', NULL),
  ('gasto', 'internet',                599, 'Telmex Infinitum — Casa Roma',          '2026-03-05', '11111111-1111-1111-1111-111111111111', NULL),
  ('gasto', 'predial',                2400, 'Predial anual — Casa Roma',             '2026-01-31', '11111111-1111-1111-1111-111111111111', NULL),
  ('gasto', 'predial',                1850, 'Predial anual — Casa Providencia',      '2026-01-31', '44444444-4444-4444-4444-444444444444', NULL),
  ('gasto', 'honorarios-administrador', 3500, 'Honorarios administrador — julio',    '2026-07-31', NULL,                                         NULL),
  ('gasto', 'mantenimiento',          1200, 'Reparación eléctrica — Casa Roma',      '2026-01-20', '11111111-1111-1111-1111-111111111111', NULL),
  ('gasto', 'mantenimiento',           850, 'Fontanería — Casa Roma',                '2026-03-15', '11111111-1111-1111-1111-111111111111', NULL),
  ('gasto', 'mantenimiento',          3400, 'Albañilería — Casa Roma',               '2026-06-08', '11111111-1111-1111-1111-111111111111', NULL),
  ('gasto', 'mantenimiento',           600, 'Carpintería — Depto Polanco',           '2026-04-12', '22222222-2222-2222-2222-222222222222', NULL),
  ('gasto', 'mantenimiento',          4200, 'Re-certificación eléctrica — Local Centro', '2026-06-15', '33333333-3333-3333-3333-333333333333', NULL),
  ('gasto', 'sat',                    3200, 'ISR provisional — junio',               '2026-06-17', NULL,                                         NULL),
  ('gasto', 'otro-gasto',              480, 'Material de limpieza',                  '2026-04-22', '11111111-1111-1111-1111-111111111111', NULL);

-- ── 5 Facturas timbradas (CFDI D10 — arrendamiento) ──────────────────────────

-- Vinculamos facturas a 5 recibos ya pagados, generando UUID y folioFiscal en SQL.
INSERT INTO facturas (recibo_id, uuid, folio_fiscal, serie, folio, uso_cfdi, estatus, xml_path, pdf_path, timbrado_en)
SELECT r.id,
       gen_random_uuid()::varchar(36),                 -- uuid SAT (formato canónico)
       gen_random_uuid()::varchar(36),                 -- folio fiscal (placeholder 36 chars)
       'A',
       lpad((row_number() over (order by r.pagado_en))::text, 6, '0'),
       'D10',
       'timbrada',
       '/data/cfdi/' || r.numero_recibo || '.xml',
       '/data/cfdi/' || r.numero_recibo || '.pdf',
       r.pagado_en + interval '15 minutes'
FROM recibos r
WHERE r.estatus = 'pagado'
ORDER BY r.pagado_en
LIMIT 5;

-- Vincular los recibos facturados con su CFDI
UPDATE recibos r
SET factura_id = f.id
FROM facturas f
WHERE f.recibo_id = r.id
  AND r.factura_id IS NULL;

-- ── Cuentas de demo para el portal de inquilinos ──────────────────────────────
--
-- Asigna password_hash (bcrypt cost 10) a dos inquilinos del seed que tienen
-- contrato vigente, para poder probar el login desde el portal.
--
--   ana.hernandez@example.com  → demo1234  (Casa Roma, contrato vigente)
--   luis.martinez@example.com  → demo1234  (Depto Polanco, contrato vigente)
--
-- Si el seed se vuelve a correr, basta con re-ejecutar este UPDATE; es idempotente.

UPDATE inquilinos
SET password_hash = '$2a$10$o3hu5c7/opGrK5dcRgObruQqE6Lk1ieUKxtirExGJPFnSpsyYcQ/.'
WHERE correo IN (
  'ana.hernandez@example.com',
  'luis.martinez@example.com'
);

COMMIT;

-- =============================================================================
-- Verificación post-seed (ejecutar manualmente si se desea):
--
--   SELECT 'propiedades'   AS tabla, COUNT(*) FROM propiedades
--   UNION ALL SELECT 'inquilinos',     COUNT(*) FROM inquilinos
--   UNION ALL SELECT 'contratos',      COUNT(*) FROM contratos
--   UNION ALL SELECT 'recibos',        COUNT(*) FROM recibos
--   UNION ALL SELECT 'recibos_pagados',COUNT(*) FROM recibos WHERE estatus='pagado'
--   UNION ALL SELECT 'recibos_vencidos',COUNT(*) FROM recibos WHERE estatus='vencido'
--   UNION ALL SELECT 'mantenimientos', COUNT(*) FROM mantenimientos
--   UNION ALL SELECT 'movimientos',    COUNT(*) FROM movimientos_contables
--   UNION ALL SELECT 'facturas',       COUNT(*) FROM facturas;
--
-- Salida esperada:
--   propiedades       | 8
--   inquilinos        | 12
--   contratos         | 10
--   recibos           | 58
--   recibos_pagados   | 33
--   recibos_vencidos  | 17  (5 de Miguel Ángel + 12 del inquilino "moroso")
--   recibos_pendientes| 7
--   recibos_cancelados| 1
--   mantenimientos    | 12
--   movimientos       | 31  (17 ingresos + 14 gastos)
--   facturas          | 5
--
-- Después de cargar este SQL:
--   1. pnpm dev (arrancar backend)
--   2. POST /api/ia/modelos/morosidad/entrenar   → accuracy > 0.7 esperado
--   3. POST /api/ia/modelos/vacancia/entrenar     → detecta el contrato terminado anticipadamente
--   4. POST /api/ia/modelos/mantenimiento/entrenar → Casa Roma debería liderar el ranking
--   5. Login admin: usuario=admin, password=admin123
--   6. Login portal: correo=ana.hernandez@example.com, password=demo1234
--   7. Asignar más cuentas con POST /api/inquilinos/<id>/cuenta (body: {password})
-- =============================================================================