/**
 * Persistencia de modelos entrenados en filesystem (JSON).
 *
 * Por qué filesystem y no DB:
 * - Los coeficientes son <50KB serializados.
 * - No hay concurrencia (entrenamiento es manual o via job nocturno).
 * - Versionar modelos es trivial (nombre del archivo incluye versión).
 *
 * Si en el futuro hay múltiples instancias del API, conviene mover a DB o
 * a un volumen compartido (Docker volume, S3, etc.). Trade-off documentado.
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import type { ModeloLogistico } from './logreg';
import type { ModeloLineal } from './linear';

const RUTA_BASE = path.resolve(__dirname, '../../../../data/modelos');

export type TipoModelo = 'logistico' | 'lineal';
export type ModeloEntrenado = ModeloLogistico | ModeloLineal;

async function asegurarDirectorio(): Promise<void> {
  await fs.mkdir(RUTA_BASE, { recursive: true });
}

function rutaArchivo(nombreModelo: string, tipo: TipoModelo): string {
  return path.join(RUTA_BASE, `${nombreModelo}.${tipo}.json`);
}

/**
 * Serializa y guarda un modelo entrenado.
 * Si ya existe, lo sobreescribe.
 */
export async function guardarModelo(
  nombreModelo: string,
  modelo: ModeloEntrenado,
): Promise<void> {
  await asegurarDirectorio();
  const ruta = rutaArchivo(nombreModelo, modelo.tipo);
  await fs.writeFile(ruta, JSON.stringify(modelo, null, 2), 'utf-8');
}

/**
 * Carga un modelo desde filesystem.
 * Devuelve null si no existe.
 */
export async function cargarModelo(
  nombreModelo: string,
  tipo: TipoModelo,
): Promise<ModeloEntrenado | null> {
  try {
    const ruta = rutaArchivo(nombreModelo, tipo);
    const contenido = await fs.readFile(ruta, 'utf-8');
    return JSON.parse(contenido) as ModeloEntrenado;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw err;
  }
}

/**
 * Elimina un modelo del filesystem.
 * No lanza error si no existe.
 */
export async function eliminarModelo(
  nombreModelo: string,
  tipo: TipoModelo,
): Promise<void> {
  try {
    const ruta = rutaArchivo(nombreModelo, tipo);
    await fs.unlink(ruta);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
  }
}

/**
 * Lista todos los modelos entrenados (archivos en el directorio).
 */
export async function listarModelos(): Promise<
  Array<{ nombre: string; tipo: TipoModelo; ruta: string }>
> {
  await asegurarDirectorio();
  const archivos = await fs.readdir(RUTA_BASE);
  return archivos
    .filter((f) => f.endsWith('.json'))
    .map((f) => {
      const nombre = f.replace(/\.(logistico|lineal)\.json$/, '');
      const tipo = f.endsWith('.logistico.json') ? 'logistico' : 'lineal';
      return { nombre, tipo: tipo as TipoModelo, ruta: path.join(RUTA_BASE, f) };
    });
}