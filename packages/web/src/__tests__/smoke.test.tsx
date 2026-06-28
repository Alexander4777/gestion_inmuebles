import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock del API de inteligencia para que useQuery resuelva inmediatamente
vi.mock('@/services/inteligencia.api', () => ({
  inteligenciaAPI: {
    dashboard: () =>
      Promise.resolve({
        estadoGeneral: 'entrenado',
        totalRecibosEnRiesgo: 0,
        totalContratosEnRiesgo: 0,
        totalPropiedadesEnMantenimientoAlto: 0,
        topMorosidad: [],
        topVacancia: [],
        topMantenimiento: [],
        modelos: [],
      }),
  },
}));

beforeEach(() => {
  // Mock localStorage para que requerirAuth no redirija
  localStorage.setItem('token', 'test-token');
});

import { DashboardPage } from '@/modulos/dashboard/DashboardPage';

function renderConQuery(ui: React.ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('Web Smoke Test', () => {
  it('DashboardPage renderiza el título', async () => {
    renderConQuery(<DashboardPage />);
    expect(await screen.findByText('Dashboard')).toBeDefined();
  });
});