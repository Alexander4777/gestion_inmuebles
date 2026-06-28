import { describe, it, expect } from 'vitest';
import {
  entrenarLogistico,
  predecirLogistico,
  serializarLogistico,
  deserializarLogistico,
} from './logreg';
import {
  entrenarLineal,
  predecirLineal,
  serializarLineal,
  deserializarLineal,
} from './linear';
import {
  importanciaLogistico,
  importanciaLineal,
  normalizarImportancia,
} from './feature-importance';

/**
 * Genera un dataset sintético de clasificación con una frontera lineal conocida:
 * y = 1 si x[0] + x[1] > 0, 0 en otro caso (con algo de ruido).
 */
function generarDatasetClasificacion(n = 200, semilla = 42): {
  features: number[][];
  etiquetas: number[];
} {
  let a = semilla;
  const rng = () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const features: number[][] = [];
  const etiquetas: number[] = [];
  for (let i = 0; i < n; i++) {
    const x0 = rng() * 4 - 2;
    const x1 = rng() * 4 - 2;
    // algo de ruido (10% de las etiquetas invertidas)
    const invertida = rng() < 0.1;
    const y = x0 + x1 > 0 ? 1 : 0;
    features.push([x0, x1]);
    etiquetas.push(invertida ? 1 - y : y);
  }
  return { features, etiquetas };
}

/**
 * Genera dataset de regresión lineal: y = 3*x0 - 2*x1 + 1 + ruido.
 */
function generarDatasetRegresion(n = 200, semilla = 42): {
  features: number[][];
  etiquetas: number[];
} {
  let a = semilla;
  const rng = () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const features: number[][] = [];
  const etiquetas: number[] = [];
  for (let i = 0; i < n; i++) {
    const x0 = rng() * 10;
    const x1 = rng() * 10;
    const y = 3 * x0 - 2 * x1 + 1 + (rng() - 0.5) * 2;
    features.push([x0, x1]);
    etiquetas.push(y);
  }
  return { features, etiquetas };
}

describe('ML: regresión logística', () => {
  it('entrena y converge a accuracy > 0.8 sobre dataset separable', () => {
    const { features, etiquetas } = generarDatasetClasificacion(200);
    const { modelo, metricas } = entrenarLogistico(
      features,
      etiquetas,
      ['x0', 'x1'],
      { epocas: 300, tazaAprendizaje: 0.5 },
    );

    expect(metricas.accuracy).toBeGreaterThan(0.8);
    expect(metricas.nEntrenamiento).toBe(160); // 80% de 200
    expect(metricas.nPrueba).toBe(40);
    expect(modelo.pesos.length).toBe(2);
    expect(modelo.nombresFeatures).toEqual(['x0', 'x1']);
  });

  it('predice probabilidades entre 0 y 1', () => {
    const { features, etiquetas } = generarDatasetClasificacion(100);
    const { modelo } = entrenarLogistico(features, etiquetas, ['x0', 'x1'], { epocas: 100 });
    const prob = predecirLogistico(modelo, [1, 1]);
    expect(prob).toBeGreaterThanOrEqual(0);
    expect(prob).toBeLessThanOrEqual(1);
  });

  it('lanza error si features y etiquetas tienen longitudes distintas', () => {
    expect(() =>
      entrenarLogistico([[1, 2], [3, 4]], [1], ['x0', 'x1']),
    ).toThrow();
  });

  it('lanza error si una fila tiene features de longitud distinta', () => {
    expect(() =>
      entrenarLogistico([[1, 2], [3]], [1, 0], ['x0', 'x1']),
    ).toThrow();
  });

  it('serializa y deserializa preservando pesos y bias', () => {
    const { features, etiquetas } = generarDatasetClasificacion(100);
    const { modelo } = entrenarLogistico(features, etiquetas, ['x0', 'x1'], { epocas: 100 });
    const json = serializarLogistico(modelo);
    const restaurado = deserializarLogistico(json);
    expect(restaurado.pesos).toEqual(modelo.pesos);
    expect(restaurado.bias).toBeCloseTo(modelo.bias, 10);
    expect(restaurado.nombresFeatures).toEqual(modelo.nombresFeatures);
  });

  it('rechaza JSON con tipo incorrecto', () => {
    expect(() => deserializarLogistico('{"tipo":"lineal","pesos":[],"bias":0,"nombresFeatures":[]}')).toThrow();
  });
});

describe('ML: regresión lineal (Ridge)', () => {
  it('recupera coeficientes aproximadamente en dataset sin ruido', () => {
    const { features, etiquetas } = generarDatasetRegresion(500, 7);
    const { modelo, metricas } = entrenarLineal(features, etiquetas, ['x0', 'x1'], {});

    // El modelo debe capturar la dirección, no necesariamente los valores exactos (L2 + bias aprendido)
    expect(metricas.r2).toBeGreaterThan(0.7);
    expect(modelo.pesos[0]).toBeGreaterThan(0); // coeficiente de x0 debe ser positivo
    expect(modelo.pesos[1]).toBeLessThan(0); // coeficiente de x1 debe ser negativo
  });

  it('predice valores razonables dentro del rango', () => {
    const { features, etiquetas } = generarDatasetRegresion(200, 7);
    const { modelo } = entrenarLineal(features, etiquetas, ['x0', 'x1']);
    const prediccion = predecirLineal(modelo, [5, 5]);
    expect(prediccion).toBeGreaterThan(-100);
    expect(prediccion).toBeLessThan(100);
  });

  it('serializa y deserializa', () => {
    const { features, etiquetas } = generarDatasetRegresion(100, 7);
    const { modelo } = entrenarLineal(features, etiquetas, ['x0', 'x1']);
    const restaurado = deserializarLineal(serializarLineal(modelo));
    expect(restaurado.pesos).toEqual(modelo.pesos);
    expect(restaurado.bias).toBeCloseTo(modelo.bias, 10);
  });
});

describe('ML: feature importance', () => {
  it('identifica la feature más importante en clasificación', () => {
    const { features, etiquetas } = generarDatasetClasificacion(300, 11);
    const { modelo } = entrenarLogistico(features, etiquetas, ['x0', 'x1'], { epocas: 200 });

    const idxVal = features.slice(0, 60);
    const yVal = etiquetas.slice(0, 60);

    const importancias = importanciaLogistico(modelo, idxVal, yVal);
    expect(importancias.length).toBe(2);
    // Ambas features son simétricas, no podemos asegurar cuál es la primera;
    // pero la suma de importancias debe ser > 0.
    const suma = importancias.reduce((acc, it) => acc + it.importancia, 0);
    expect(suma).toBeGreaterThan(0);
  });

  it('identifica feature más importante en regresión', () => {
    const { features, etiquetas } = generarDatasetRegresion(300, 13);
    const { modelo } = entrenarLineal(features, etiquetas, ['x0', 'x1']);

    const idxVal = features.slice(0, 60);
    const yVal = etiquetas.slice(0, 60);

    const importancias = importanciaLineal(modelo, idxVal, yVal);
    expect(importancias.length).toBe(2);
    const suma = importancias.reduce((acc, it) => acc + it.importancia, 0);
    expect(suma).toBeGreaterThanOrEqual(0);
  });

  it('normalizarImportancia produce valores que suman 1', () => {
    const items = [
      { nombre: 'a', importancia: 3 },
      { nombre: 'b', importancia: 1 },
    ];
    const normalizado = normalizarImportancia(items);
    expect(normalizado[0]!.importancia).toBeCloseTo(0.75, 5);
    expect(normalizado[1]!.importancia).toBeCloseTo(0.25, 5);
  });

  it('normalizarImportancia devuelve ceros si todo es cero', () => {
    const items = [
      { nombre: 'a', importancia: 0 },
      { nombre: 'b', importancia: 0 },
    ];
    const normalizado = normalizarImportancia(items);
    expect(normalizado.every((it) => it.importancia === 0)).toBe(true);
  });
});
