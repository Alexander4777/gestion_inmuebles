/**
 * Regresión lineal con regularización L2 (Ridge) en TypeScript puro.
 *
 * Usada para predicción de montos continuos (ej. costo anual esperado de mantenimiento).
 * Solución analítica vía ecuaciones normales, no gradient descent — converge en una iteración.
 */

export interface ModeloLineal {
  tipo: 'lineal';
  pesos: number[];
  bias: number;
  nombresFeatures: string[];
  version: string;
  metricas?: MetricasRegresion;
}

export interface OpcionesLineal {
  regularizacionL2?: number; // default 0.01
  proporcionValidacion?: number; // default 0.2
  semilla?: number; // default 42
}

export interface MetricasRegresion {
  rmse: number;
  mae: number;
  r2: number;
  nEntrenamiento: number;
  nPrueba: number;
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

/**
 * Resuelve el sistema lineal (X^T X + λI) w = X^T y mediante eliminación gaussiana.
 * X es matriz [n][m], y es vector [n].
 */
function resolverEcuacionesNormales(
  X: number[][],
  y: number[],
  lambda: number,
): { pesos: number[]; bias: number } {
  const n = X.length;
  const m = X[0]!.length;

  // Normalizar: añadir columna de 1s al final para el bias
  // Sistema: (X'ᵀ X' + λI) β = X'ᵀ y  donde X' = [X | 1]
  const m2 = m + 1;

  // Construir A = X'ᵀ X'  (matriz [m+1][m+1])
  const A: number[][] = Array.from({ length: m2 }, () => new Array<number>(m2).fill(0));
  // Construir b = X'ᵀ y  (vector [m+1])
  const b: number[] = new Array<number>(m2).fill(0);

  for (let i = 0; i < n; i++) {
    const xi = X[i]!;
    const yi = y[i]!;
    for (let k = 0; k < m; k++) {
      const xik = xi[k]!;
      b[k]! += xik * yi;
      for (let j = 0; j < m; j++) {
        A[k]![j]! += xik * xi[j]!;
      }
      A[k]![m]! += xik; // bias
    }
    b[m]! += yi;
  }
  A[m]![m]! = n;

  // Regularización L2 (no regularizar bias)
  for (let k = 0; k < m; k++) {
    A[k]![k]! += lambda;
  }

  // Eliminación gaussiana con pivoteo parcial
  for (let k = 0; k < m2; k++) {
    // Pivote: fila con mayor |A[i][k]| para i >= k
    let maxVal = Math.abs(A[k]![k]!);
    let maxRow = k;
    for (let i = k + 1; i < m2; i++) {
      const v = Math.abs(A[i]![k]!);
      if (v > maxVal) {
        maxVal = v;
        maxRow = i;
      }
    }
    if (maxRow !== k) {
      [A[k], A[maxRow]] = [A[maxRow]!, A[k]!];
      [b[k], b[maxRow]] = [b[maxRow]!, b[k]!];
    }

    const pivot = A[k]![k]!;
    if (Math.abs(pivot) < 1e-12) continue; // matriz singular, saltar

    for (let i = k + 1; i < m2; i++) {
      const factor = A[i]![k]! / pivot;
      for (let j = k; j < m2; j++) {
        A[i]![j]! -= factor * A[k]![j]!;
      }
      b[i]! -= factor * b[k]!;
    }
  }

  // Sustitución hacia atrás
  const beta = new Array<number>(m2).fill(0);
  for (let i = m2 - 1; i >= 0; i--) {
    let suma = b[i]!;
    for (let j = i + 1; j < m2; j++) {
      suma -= A[i]![j]! * beta[j]!;
    }
    beta[i] = suma / A[i]![i]!;
  }

  return {
    pesos: beta.slice(0, m),
    bias: beta[m]!,
  };
}

export function entrenarLineal(
  features: number[][],
  etiquetas: number[],
  nombresFeatures: string[],
  opciones: OpcionesLineal = {},
): { modelo: ModeloLineal; metricas: MetricasRegresion } {
  if (features.length === 0) throw new Error('Dataset vacío');
  if (features.length !== etiquetas.length) {
    throw new Error('features y etiquetas deben tener la misma longitud');
  }

  const n = features.length;
  const lambda = opciones.regularizacionL2 ?? 0.01;
  const propVal = opciones.proporcionValidacion ?? 0.2;
  const rng = crearRng(opciones.semilla ?? 42);

  const indices = Array.from({ length: n }, (_, i) => i);
  barajar(indices, rng);
  const nVal = Math.max(1, Math.floor(n * propVal));
  const nTrain = n - nVal;
  const trainIdx = indices.slice(0, nTrain);

  const XTrain = trainIdx.map((i) => features[i]!);
  const yTrain = trainIdx.map((i) => etiquetas[i]!);

  const { pesos, bias } = resolverEcuacionesNormales(XTrain, yTrain, lambda);

  // Métricas en validación
  const valIdx = indices.slice(nTrain);
  const metricas = calcularMetricasLineal(features, etiquetas, valIdx, pesos, bias);

  const version = `linear-v1-${new Date().toISOString().slice(0, 10)}`;
  const modelo: ModeloLineal = {
    tipo: 'lineal',
    pesos,
    bias,
    nombresFeatures,
    version,
    metricas,
  };

  return { modelo, metricas };
}

function calcularMetricasLineal(
  features: number[][],
  etiquetas: number[],
  valIdx: number[],
  pesos: number[],
  bias: number,
): MetricasRegresion {
  if (valIdx.length === 0) {
    return { rmse: 0, mae: 0, r2: 0, nEntrenamiento: 0, nPrueba: 0 };
  }
  const yVerdadero = valIdx.map((i) => etiquetas[i]!);
  const yPredicho = valIdx.map((i) => {
    const x = features[i]!;
    return x.reduce((acc, xi, k) => acc + xi * pesos[k]!, bias);
  });

  let sumaErroresCuadrado = 0;
  let sumaErroresAbs = 0;
  const mediaY = yVerdadero.reduce((a, b) => a + b, 0) / yVerdadero.length;
  let sumaCuadradosTotal = 0;
  let sumaCuadradosResiduos = 0;

  for (let i = 0; i < yVerdadero.length; i++) {
    const yi = yVerdadero[i]!;
    const pi = yPredicho[i]!;
    const error = pi - yi;
    sumaErroresCuadrado += error * error;
    sumaErroresAbs += Math.abs(error);
    sumaCuadradosTotal += (yi - mediaY) ** 2;
    sumaCuadradosResiduos += error * error;
  }

  const rmse = Math.sqrt(sumaErroresCuadrado / yVerdadero.length);
  const mae = sumaErroresAbs / yVerdadero.length;
  const r2 = sumaCuadradosTotal > 0 ? 1 - sumaCuadradosResiduos / sumaCuadradosTotal : 0;

  return {
    rmse,
    mae,
    r2,
    nEntrenamiento: 0, // se sobreescribe en el orquestador
    nPrueba: yVerdadero.length,
  };
}

export function predecirLineal(modelo: ModeloLineal, features: number[]): number {
  if (features.length !== modelo.pesos.length) {
    throw new Error(
      `Features (${features.length}) no coinciden con pesos (${modelo.pesos.length})`,
    );
  }
  return features.reduce((acc, xi, k) => acc + xi * modelo.pesos[k]!, modelo.bias);
}

export function serializarLineal(modelo: ModeloLineal): string {
  return JSON.stringify(modelo);
}

export function deserializarLineal(json: string): ModeloLineal {
  const obj = JSON.parse(json) as ModeloLineal;
  if (obj.tipo !== 'lineal') throw new Error('JSON no es un modelo lineal');
  return obj;
}
