/**
 * Regresión logística en TypeScript puro.
 *
 * Sin dependencias externas. Implementa:
 * - Entrenamiento por gradient descent con regularización L2.
 * - Predicción de probabilidad sigmoide σ(w·x + b).
 * - Serialización a JSON para persistencia.
 *
 * Limitaciones conscientes (MVP):
 * - Sin mini-batches (entrena sobre todo el dataset por época).
 * - Sin learning rate scheduling adaptativo (Adam, RMSprop).
 * - Para datasets grandes (>10k filas), entrenar es lento.
 *
 * Para el dominio (decenas de propiedades, cientos de recibos) es más que suficiente.
 */

export interface ModeloLogistico {
  tipo: 'logistico';
  pesos: number[]; // longitud = n_features
  bias: number;
  nombresFeatures: string[];
  version: string; // ej. "logreg-v1-2026-06-27"
  metricas?: MetricasClasificacion;
}

export interface OpcionesEntrenamiento {
  tazaAprendizaje?: number; // default 0.1
  epocas?: number; // default 200
  regularizacionL2?: number; // default 0.01
  proporcionValidacion?: number; // default 0.2
  semilla?: number; // default 42
  verbose?: boolean; // default false
}

export interface MetricasClasificacion {
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  auc: number;
  nEntrenamiento: number;
  nPrueba: number;
}

// ── Utilidades internas ────────────────────────────────────────────────────────

function sigmoide(z: number): number {
  if (z >= 0) {
    const ez = Math.exp(-z);
    return 1 / (1 + ez);
  }
  const ez = Math.exp(z);
  return ez / (1 + ez);
}

/** Generador de números pseudoaleatorios con semilla (Mulberry32) — para reproducibilidad. */
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

/** Baraja un array in-place con el RNG dado (Fisher-Yates). */
function barajar<T>(arr: T[], rng: () => number): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
}

// ── API pública ────────────────────────────────────────────────────────────────

/**
 * Entrena un modelo de regresión logística.
 *
 * @param features - matriz [n][m] donde n=muestras, m=features
 * @param etiquetas - vector binario {0,1} de longitud n
 * @param nombresFeatures - etiqueta de cada feature (para serialización)
 * @param opciones - hiperparámetros
 */
export function entrenarLogistico(
  features: number[][],
  etiquetas: number[],
  nombresFeatures: string[],
  opciones: OpcionesEntrenamiento = {},
): { modelo: ModeloLogistico; metricas: MetricasClasificacion } {
  if (features.length === 0) throw new Error('Dataset vacío');
  if (features.length !== etiquetas.length) {
    throw new Error('features y etiquetas deben tener la misma longitud');
  }

  const n = features.length;
  const m = nombresFeatures.length;
  const lr = opciones.tazaAprendizaje ?? 0.1;
  const epocas = opciones.epocas ?? 200;
  const lambda = opciones.regularizacionL2 ?? 0.01;
  const propVal = opciones.proporcionValidacion ?? 0.2;
  const rng = crearRng(opciones.semilla ?? 42);

  // Validación: features[i] debe tener longitud m
  for (let i = 0; i < n; i++) {
    if (features[i]!.length !== m) {
      throw new Error(`Fila ${i} tiene ${features[i]!.length} features, se esperaban ${m}`);
    }
  }

  // Shuffle + split
  const indices = Array.from({ length: n }, (_, i) => i);
  barajar(indices, rng);
  const nVal = Math.max(1, Math.floor(n * propVal));
  const nTrain = n - nVal;
  const trainIdx = indices.slice(0, nTrain);
  const valIdx = indices.slice(nTrain);

  // Inicializar pesos (Xavier simplificado)
  const pesos = new Array<number>(m).fill(0).map(() => (rng() - 0.5) * 0.1);
  let bias = 0;

  // Entrenamiento (gradient descent batch)
  for (let epoca = 0; epoca < epocas; epoca++) {
    // Calcular gradientes
    const gradPesos = new Array<number>(m).fill(0);
    let gradBias = 0;

    for (const i of trainIdx) {
      const x = features[i]!;
      const y = etiquetas[i]!;
      const z = x.reduce((acc, xi, k) => acc + xi * pesos[k]!, bias);
      const pred = sigmoide(z);
      const error = pred - y;
      gradBias += error;
      for (let k = 0; k < m; k++) {
        gradPesos[k]! += error * x[k]!;
      }
    }

    // Aplicar gradiente con regularización L2 (no regularizar bias)
    for (let k = 0; k < m; k++) {
      const grad = gradPesos[k]! / nTrain + lambda * pesos[k]!;
      pesos[k]! -= lr * grad;
    }
    bias -= (lr * gradBias) / nTrain;

    if (opciones.verbose && epoca % 50 === 0) {
      const perdida = calcularPerdidaEntrenamiento(features, etiquetas, trainIdx, pesos, bias, lambda);
      console.log(`[logreg] Época ${epoca}: pérdida=${perdida.toFixed(4)}`);
    }
  }

  // Métricas en validación
  const metricas = calcularMetricas(features, etiquetas, trainIdx, valIdx, pesos, bias, m);

  const version = `logreg-v1-${new Date().toISOString().slice(0, 10)}`;
  const modelo: ModeloLogistico = {
    tipo: 'logistico',
    pesos,
    bias,
    nombresFeatures,
    version,
    metricas,
  };

  return { modelo, metricas };
}

function calcularPerdidaEntrenamiento(
  features: number[][],
  etiquetas: number[],
  idx: number[],
  pesos: number[],
  bias: number,
  lambda: number,
): number {
  let perdida = 0;
  for (const i of idx) {
    const x = features[i]!;
    const y = etiquetas[i]!;
    const z = x.reduce((acc, xi, k) => acc + xi * pesos[k]!, bias);
    const p = Math.max(1e-15, Math.min(1 - 1e-15, sigmoide(z)));
    perdida -= y * Math.log(p) + (1 - y) * Math.log(1 - p);
  }
  perdida /= idx.length;
  // L2 (sin bias)
  const normL2 = pesos.reduce((acc, w) => acc + w * w, 0) * (lambda / 2);
  return perdida + normL2;
}

function calcularMetricas(
  features: number[][],
  etiquetas: number[],
  trainIdx: number[],
  valIdx: number[],
  pesos: number[],
  bias: number,
  _m: number,
): MetricasClasificacion {
  // Probabilidades en validación
  const probsVal = valIdx.map((i) => {
    const x = features[i]!;
    const z = x.reduce((acc, xi, k) => acc + xi * pesos[k]!, bias);
    return sigmoide(z);
  });
  const yVal = valIdx.map((i) => etiquetas[i]!);

  // Predicciones binarias con threshold 0.5
  const predVal = probsVal.map((p) => (p >= 0.5 ? 1 : 0));

  let tp = 0, fp = 0, fn = 0, tn = 0;
  for (let i = 0; i < yVal.length; i++) {
    if (yVal[i] === 1 && predVal[i] === 1) tp++;
    else if (yVal[i] === 0 && predVal[i] === 1) fp++;
    else if (yVal[i] === 1 && predVal[i] === 0) fn++;
    else tn++;
  }

  const accuracy = (tp + tn) / Math.max(1, yVal.length);
  const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
  const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
  const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
  const auc = calcularAuc(yVal, probsVal);

  return {
    accuracy,
    precision,
    recall,
    f1,
    auc,
    nEntrenamiento: trainIdx.length,
    nPrueba: valIdx.length,
  };
}

/** AUC-ROC via regla del trapecio sobre puntos ordenados por probabilidad descendente. */
function calcularAuc(yVerdadero: number[], probs: number[]): number {
  const n = yVerdadero.length;
  if (n === 0) return 0;
  // Pares (prob, y)
  const pares = yVerdadero.map((y, i) => ({ y, p: probs[i]! }));
  pares.sort((a, b) => b.p - a.p);

  let auc = 0;
  let tpAcum = 0;
  let fpAcum = 0;
  let tpPrev = 0;
  let fpPrev = 0;

  for (const par of pares) {
    if (par.y === 1) tpAcum++;
    else fpAcum++;
    // Trapecio
    auc += (fpAcum - fpPrev) * (tpAcum + tpPrev) / 2;
    tpPrev = tpAcum;
    fpPrev = fpAcum;
  }

  const totalPos = yVerdadero.filter((y) => y === 1).length;
  const totalNeg = n - totalPos;
  if (totalPos === 0 || totalNeg === 0) return 0;
  return auc / (totalPos * totalNeg);
}

/**
 * Predice la probabilidad dado un modelo y un vector de features.
 * Devuelve un número entre 0 y 1.
 */
export function predecirLogistico(modelo: ModeloLogistico, features: number[]): number {
  if (features.length !== modelo.pesos.length) {
    throw new Error(
      `Features (${features.length}) no coinciden con pesos (${modelo.pesos.length})`,
    );
  }
  const z = features.reduce((acc, xi, k) => acc + xi * modelo.pesos[k]!, modelo.bias);
  return sigmoide(z);
}

// ── Serialización ──────────────────────────────────────────────────────────────

export function serializarLogistico(modelo: ModeloLogistico): string {
  return JSON.stringify(modelo);
}

export function deserializarLogistico(json: string): ModeloLogistico {
  const obj = JSON.parse(json) as ModeloLogistico;
  if (obj.tipo !== 'logistico') throw new Error('JSON no es un modelo logístico');
  return obj;
}
