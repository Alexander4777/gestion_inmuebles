/**
 * Hooks TanStack Query para listar entidades en formularios de selección.
 *
 * Centraliza los useQuery que alimentan los Selectores de los formularios.
 * Mantener esto en un único sitio evita:
 * - Cargar la misma lista varias veces desde distintos formularios (cada uno su useQuery).
 * - Inconsistencias en cache keys.
 * - Lógica repetida de manejo de carga.
 *
 * NOTA sobre filtros: para contratos y recibos NO usamos filtros por estatus por defecto
 * porque al crear el recibo necesitamos poder elegir contratos terminados también
 * (ej. recibos retroactivos de fin de mes). Para mantenimientos y facturas, sí filtramos.
 */

import { useQuery } from '@tanstack/react-query';
import { propiedadesAPI } from './propiedades.api';
import { inquilinosAPI } from './inquilinos.api';
import { contratosAPI } from './contratos.api';
import { recibosAPI } from './recibos.api';
import { facturacionAPI } from './facturacion.api';
import type { OpcionSelector } from '@/core/ui/Selector';

export function usePropiedadesParaSelecto() {
  const { data = [], isLoading } = useQuery({
    queryKey: ['propiedades', 'selector'],
    queryFn: () => propiedadesAPI.listar({ activa: true }),
  });
  const opciones: OpcionSelector[] = data
    .map((p) => ({
      value: p.id,
      etiqueta: p.nombre,
      descripcion: `${p.direccion.calle} #${p.direccion.numero}, ${p.direccion.colonia}`,
    }))
    .sort((a, b) => a.etiqueta.localeCompare(b.etiqueta, 'es'));
  return { opciones, isLoading };
}

export function useInquilinosParaSelecto() {
  const { data = [], isLoading } = useQuery({
    queryKey: ['inquilinos', 'selector'],
    queryFn: () => inquilinosAPI.listar({ activo: true }),
  });
  const opciones: OpcionSelector[] = data
    .map((i) => ({
      value: i.id,
      etiqueta: `${i.nombre} ${i.apellidoPaterno} ${i.apellidoMaterno}`,
    }))
    .sort((a, b) => a.etiqueta.localeCompare(b.etiqueta, 'es'));
  return { opciones, isLoading };
}

export function useContratosParaSelecto() {
  const { data = [], isLoading } = useQuery({
    queryKey: ['contratos', 'selector'],
    queryFn: () => contratosAPI.listar(),
  });
  const opciones: OpcionSelector[] = data
    .map((c) => ({
      value: c.id,
      etiqueta: `Contrato ${c.id.slice(0, 8)}`,
      descripcion: `${c.fechaInicio} → ${c.fechaFin} · $${c.rentaMensual.toLocaleString('es-MX')}/mes`,
      deshabilitado: c.estatus === 'terminado' || c.estatus === 'cancelado',
    }))
    .sort((a, b) => a.descripcion!.localeCompare(b.descripcion!, 'es'));
  return { opciones, isLoading };
}

export function useRecibosParaSelecto(soloSinFactura = false) {
  const { data = [], isLoading } = useQuery({
    queryKey: ['recibos', 'selector', soloSinFactura],
    queryFn: () =>
      recibosAPI.listar(soloSinFactura ? { estatus: 'pendiente' } : undefined),
  });
  const opciones: OpcionSelector[] = data
    .map((r) => ({
      value: r.id,
      etiqueta: `Recibo ${r.numeroRecibo}`,
      descripcion: `${r.fechaLimitePago} · $${r.total.toLocaleString('es-MX')}`,
    }))
    .sort((a, b) => b.descripcion!.localeCompare(a.descripcion!, 'es'));
  return { opciones, isLoading };
}

export function useFacturasParaSelecto() {
  const { data = [], isLoading } = useQuery({
    queryKey: ['facturas', 'selector'],
    queryFn: () => facturacionAPI.listar(),
  });
  const opciones: OpcionSelector[] = data
    .map((f) => ({
      value: f.id,
      etiqueta: `${f.serie}-${f.folio}`,
      descripcion: `${f.creadoEn.slice(0, 10)} · ${f.estatus}`,
    }))
    .sort((a, b) => b.descripcion!.localeCompare(a.descripcion!, 'es'));
  return { opciones, isLoading };
}