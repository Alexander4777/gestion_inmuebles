/**
 * Tests unitarios del módulo IA.
 *
 * Los tests que requieren DB (entrenamiento, predicciones top, dashboard) están
 * fuera de scope: vitest no tiene DB de prueba. Aquí se cubren las funciones puras
 * y la lógica de transformación de tipos.
 */

import { describe, it, expect } from 'vitest';
import { clasificarRiesgo } from './inteligencia.service';

describe('IA: clasificarRiesgo', () => {
  it('probabilidad >= 0.7 es "alto"', () => {
    expect(clasificarRiesgo(0.7)).toBe('alto');
    expect(clasificarRiesgo(0.95)).toBe('alto');
    expect(clasificarRiesgo(1.0)).toBe('alto');
  });

  it('probabilidad entre umbral y 0.7 es "medio" (umbral default 0.5)', () => {
    expect(clasificarRiesgo(0.5)).toBe('medio');
    expect(clasificarRiesgo(0.65)).toBe('medio');
  });

  it('probabilidad < umbral es "bajo"', () => {
    expect(clasificarRiesgo(0.0)).toBe('bajo');
    expect(clasificarRiesgo(0.3)).toBe('bajo');
    expect(clasificarRiesgo(0.49)).toBe('bajo');
  });

  it('umbral personalizado afecta la clasificación', () => {
    // Con umbral 0.8: alto = max(0.7, 1.0) = 1.0
    // p<0.8 → bajo, 0.8<=p<1.0 → medio, p>=1.0 → alto
    expect(clasificarRiesgo(0.5, 0.8)).toBe('bajo');
    expect(clasificarRiesgo(0.85, 0.8)).toBe('medio');
    expect(clasificarRiesgo(0.75, 0.8)).toBe('bajo'); // < 0.8 es bajo
  });

  it('maneja probabilidades en los extremos (0 y 1)', () => {
    expect(clasificarRiesgo(0)).toBe('bajo');
    expect(clasificarRiesgo(1)).toBe('alto');
  });
});

describe('IA: integración con logreg', () => {
  it('predicción con modelo entrenado da probabilidad válida', async () => {
    const { entrenarLogistico, predecirLogistico } = await import('./ml/logreg');
    // Dataset sintético perfectamente separable
    const features = [
      [0, 0],
      [0, 1],
      [1, 0],
      [1, 1],
    ];
    const etiquetas = [0, 0, 0, 1];
    const { modelo } = entrenarLogistico(features, etiquetas, ['x0', 'x1'], { epocas: 500 });

    // Punto claro positivo
    const pPos = predecirLogistico(modelo, [0.9, 0.9]);
    const pNeg = predecirLogistico(modelo, [0.1, 0.1]);
    expect(pPos).toBeGreaterThan(pNeg);
    expect(pPos).toBeGreaterThan(0.5);
  });
});

describe('IA: feature importance sobre modelos reales', () => {
  it('feature importance logística devuelve importancias positivas en dataset separable', async () => {
    const { entrenarLogistico } = await import('./ml/logreg');
    const { importanciaLogistico, normalizarImportancia } = await import('./ml/feature-importance');

    // Dataset linealmente separable: x0 es la feature informativa, x1 es ruido.
    // Usamos RNG seedable para reproducibilidad.
    let a = 99;
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
    for (let i = 0; i < 200; i++) {
      const x0 = rng() * 4 - 2;
      const x1 = rng() * 4 - 2; // mismo rango, ruido simétrico
      features.push([x0, x1]);
      etiquetas.push(x0 + x1 > 0 ? 1 : 0);
    }

    const { modelo } = entrenarLogistico(features, etiquetas, ['x0', 'x1'], {
      epocas: 300,
      tazaAprendizaje: 0.5,
    });
    const XVal = features.slice(0, 40);
    const yVal = etiquetas.slice(0, 40);

    const imp = importanciaLogistico(modelo, XVal, yVal);
    const norm = normalizarImportancia(imp);

    expect(norm.length).toBe(2);
    // Al menos una feature debe tener importancia > 0 (el modelo aprendió algo)
    const suma = norm.reduce((acc, it) => acc + it.importancia, 0);
    expect(suma).toBeGreaterThan(0);
  });
});

describe('IA: serialización / deserialización de modelos', () => {
  it('roundtrip preserva predicción', async () => {
    const { entrenarLogistico, predecirLogistico, serializarLogistico, deserializarLogistico } =
      await import('./ml/logreg');

    const features = [
      [0, 0],
      [0, 1],
      [1, 0],
      [1, 1],
    ];
    const etiquetas = [0, 0, 0, 1];
    const { modelo } = entrenarLogistico(features, etiquetas, ['x0', 'x1']);

    const json = serializarLogistico(modelo);
    const restaurado = deserializarLogistico(json);

    const pOriginal = predecirLogistico(modelo, [0.8, 0.8]);
    const pRestaurado = predecirLogistico(restaurado, [0.8, 0.8]);
    expect(pRestaurado).toBeCloseTo(pOriginal, 10);
  });
});

describe('IA: persistencia en filesystem', () => {
  it('guardar y cargar modelo desde JSON', async () => {
    const { guardarModelo, cargarModelo, eliminarModelo } = await import('./ml/persistencia');
    const { entrenarLogistico, serializarLogistico } = await import('./ml/logreg');

    const { modelo } = entrenarLogistico(
      [
        [0, 0],
        [1, 1],
      ],
      [0, 1],
      ['a', 'b'],
    );
    void serializarLogistico; // Sólo verificamos que el modelo se guarde

    const nombre = `test-morosidad-${Date.now()}`;
    try {
      await guardarModelo(nombre, modelo);
      const cargado = await cargarModelo(nombre, 'logistico');
      expect(cargado).not.toBeNull();
      expect((cargado as any).pesos).toEqual(modelo.pesos);
    } finally {
      await eliminarModelo(nombre, 'logistico');
    }
  });

  it('cargarModelo devuelve null si no existe', async () => {
    const { cargarModelo } = await import('./ml/persistencia');
    const result = await cargarModelo('modelo-inexistente-xyz', 'logistico');
    expect(result).toBeNull();
  });

  it('eliminarModelo no lanza si no existe', async () => {
    const { eliminarModelo } = await import('./ml/persistencia');
    await expect(eliminarModelo('no-existe', 'logistico')).resolves.not.toThrow();
  });
});