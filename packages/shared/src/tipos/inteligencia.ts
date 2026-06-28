/**
 * Tipos compartidos del módulo de Inteligencia Artificial.
 *
 * Estos tipos describen las predicciones que produce el módulo IA y se exponen
 * al frontend. Las predicciones son ORIENTATIVAS — no constituyen asesoría legal
 * ni financiera. Ver README para el disclaimer completo.
 */

export type NivelRiesgo = 'bajo' | 'medio' | 'alto' | 'sin-datos';

export type TipoModelo = 'logistico' | 'lineal';
export type NombreModelo = 'morosidad' | 'vacancia' | 'mantenimiento';
export type EstadoModelo = 'entrenado' | 'sin-datos' | 'no-entrenado';

export interface FeatureImportance {
  nombre: string;
  importancia: number; // 0..1 normalizada (ver normalizarImportancia en el backend)
  coef?: number; // coeficiente del modelo (sólo logistico/lineal)
}

export interface MetricasModelo {
  /** accuracy (clasificación) o R² (regresión) */
  principal: number;
  /** nombre legible: "accuracy" o "r2" */
  principalNombre: string;
  /** métricas adicionales como precision/recall/f1/auc/rmse/mae */
  detalle: Record<string, number>;
  nEntrenamiento: number;
  nPrueba: number;
}

export interface ModeloInfo {
  nombre: NombreModelo;
  tipo: TipoModelo;
  estado: EstadoModelo;
  version: string | null;
  metricas: MetricasModelo | null;
  calculadaEn: string | null;
  /** # de muestras disponibles (para mostrar en UI si el modelo no está entrenado) */
  muestrasDisponibles: number;
}

export interface PrediccionMorosidad {
  reciboId: string;
  probabilidad: number; // 0..1
  nivelRiesgo: NivelRiesgo;
  featureImportance?: FeatureImportance[];
  /** Estado de la fuente de la predicción */
  estadoModelo: EstadoModelo;
}

export interface PrediccionVacancia {
  contratoId: string;
  probabilidad: number; // 0..1
  nivelRiesgo: NivelRiesgo;
  featureImportance?: FeatureImportance[];
  estadoModelo: EstadoModelo;
}

export interface PrediccionMantenimiento {
  propiedadId: string;
  valorEstimado: number; // MXN, costo anual esperado
  estadoModelo: EstadoModelo;
  featureImportance?: FeatureImportance[];
}

export interface DashboardIA {
  estadoGeneral: EstadoModelo; // estado agregado (worst-case)
  totalRecibosEnRiesgo: number;
  totalContratosEnRiesgo: number;
  totalPropiedadesEnMantenimientoAlto: number;
  topMorosidad: PrediccionMorosidad[];
  topVacancia: PrediccionVacancia[];
  topMantenimiento: PrediccionMantenimiento[];
  modelos: ModeloInfo[];
}