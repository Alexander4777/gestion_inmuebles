import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DashboardPage } from '@/modulos/dashboard/DashboardPage';

describe('Web Smoke Test', () => {
  it('DashboardPage renderiza el título', () => {
    render(<DashboardPage />);
    expect(screen.getByText('Dashboard')).toBeDefined();
  });
});
