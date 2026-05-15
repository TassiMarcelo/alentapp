import type { SportDTO, CreateSportRequest, UpdateSportRequest } from '@alentapp/shared';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/api/v1';

export const sportsService = {
  async getAll(): Promise<SportDTO[]> {
    const response = await fetch(`${API_URL}/sports`);
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Error al obtener deportes');
    }
    return response.json();
  },

  async create(data: CreateSportRequest): Promise<SportDTO> {
    const response = await fetch(`${API_URL}/sports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Error al crear el deporte');
    }
    return response.json();
  },

  async update(id: string, data: UpdateSportRequest): Promise<SportDTO> {
    const response = await fetch(`${API_URL}/sports/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Error al actualizar el deporte');
    }
    return response.json();
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/sports/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Error al eliminar el deporte');
    }
  },
};
