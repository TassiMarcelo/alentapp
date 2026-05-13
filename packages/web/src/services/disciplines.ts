import type { DisciplineDTO, CreateDisciplineRequest } from '@alentapp/shared';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/api/v1';

export const disciplinesService = {
  async create(data: CreateDisciplineRequest): Promise<DisciplineDTO> {
    const response = await fetch(`${API_URL}/disciplines`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Error al registrar la sanción');
    }
    return response.json();
  },
};
