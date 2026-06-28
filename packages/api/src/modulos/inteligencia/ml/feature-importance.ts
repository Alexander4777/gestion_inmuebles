/**
 * Feature importance por permutación.
 *
 * Para cada feature:
 * 1. Predice el accuracy original sobre un conjunto de validación.
 * 2. Permuta (baraja) esa columna en el conjunto de validación.
 * 3. Vuelve a predecir el accuracy.
 * 4. Importancia = accuracy_original - accuracy_permutado.
 *
 * Features con importancia negativa indican que el modelo depende más del ruido que de esa feature.
 */

import { predecirLogistico, type ModeloLogistico } from './logreg';
import { predecirLineal, type ModeloLineal } from './linear';

export interface FeatureImportance {
  nombre: string;
  importancia: number;
  coef?: number; // coeficiente del modelo (sólo logistico/lineal)
}

function crearRng(semilla: number): () => number {
  let a = semilla;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function barajar<T>(arr: T[], rng: () => number): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
}

/** Calcula accuracy del modelo logístico en features/etiquetas dados. */
function accuracyLogistico(
  modelo: ModeloLogistico,
  features: number[][],
  etiquetas: number[],
): number {
  let correctos = 0;
  for (let i = 0; i < features.length; i++) {
    const p = predecirLogistico(modelo, features[i]!);
    const pred = p >= 0.5 ? 1 : 0;
    if (pred === etiquetas[i]) correctos++;
  }
  return features.length > 0 ? correctos / features.length : 0;
}

/** Calcula R² del modelo lineal en features/etiquetas dados. */
function r2Lineal(modelo: ModeloLineal, features: number[][], etiquetas: number[]): number {
  if (features.length === 0) return 0;
  const yVerdadero = etiquetas;
  const yPredicho = features.map((x) => predecirLineal(modelo, x));
  const mediaY = yVerdadero.reduce((a, b) => a + b, 0) / yVerdadero.length;
  let ssTot = 0;
  let ssRes = 0;
  for (let i = 0; i < yVerdadero.length; i++) {
    ssTot += (yVerdadero[i]! - mediaY) ** 2;
    ssRes += (yPredicho[i]! - yVerdadero[i]!) ** 2;
  }
  return ssTot > 0 ? 1 - ssRes / ssTot : 0;
}

/**
 * Calcula la importancia de cada feature del modelo logístico por permutación.
 */
export function importanciaLogistico(
  modelo: ModeloLogistico,
  featuresVal: number[][],
  etiquetasVal: number[],
  semilla = 42,
): FeatureImportance[] {
  if (featuresVal.length === 0) return [];
  const accOriginal = accuracyLogistico(modelo, featuresVal, etiquetasVal);
  const rng = crearRng(semilla);
  const m = modelo.nombresFeatures.length;

  const resultados: FeatureImportance[] = [];
  for (let k = 0; k < m; k++) {
    // Clonar features y permutar columna k
    const featuresPerm = featuresVal.map((fila) => [...fila]);
    const columna = featuresPerm.map((fila) => fila[k]!);
    barajar(columna, rng);
    for (let i = 0; i < featuresPerm.length; i++) {
      featuresPerm[i]![k] = columna[i]!;
    }
    const accPerm = accuracyLogistico(modelo, featuresPerm, etiquetasVal);
    resultados.push({
      nombre: modelo.nombresFeatures[k]!,
      importancia: Math.max(0, accOriginal - accPerm), // clamp a 0 (no negativo)
      coef: modelo.pesos[k],
    });
  }

  return resultados.sort((a, b) => b.importancia - a.importancia);
}

/**
 * Calcula la importancia de cada feature del modelo lineal por permutación.
 */
export function importanciaLineal(
  modelo: ModeloLineal,
  featuresVal: number[][],
  etiquetasVal: number[],
  semilla = 42,
): FeatureImportance[] {
  if (featuresVal.length === 0) return [];
  const r2Original = r2Lineal(modelo, featuresVal, etiquetasVal);
  const rng = crearRng(semilla);
  const m = modelo.nombresFeatures.length;

  const resultados: FeatureImportance[] = [];
  for (let k = 0; k < m; k++) {
    const featuresPerm = featuresVal.map((fila) => [...fila]);
    const columna = featuresPerm.map((fila) => fila[k]!);
    barajar(columna, rng);
    for (let i = 0; i < featuresPerm.length; i++) {
      featuresPerm[i]![k] = columna[i]!;
    }
    const r2Perm = r2Lineal(modelo, featuresPerm, etiquetasVal);
    resultados.push({
      nombre: modelo.nombresFeatures[k]!,
      importancia: Math.max(0, r2Original - r2Perm),
      coef: modelo.pesos[k],
    });
  }

  return resultados.sort((a, b) => b.importancia - a.importancia);
}

/**
 * Normaliza las importancias para que sumen 1 (útil para visualización).
 */
export function normalizarImportancia(items: FeatureImportance[]): FeatureImportance[] {
  const total = items.reduce((acc, it) => acc + it.importancia, 0);
  if (total === 0) return items.map((it) => ({ ...it, importancia: 0 }));
  return items.map((it) => ({ ...it, importancia: it.importancia / total }));
}
