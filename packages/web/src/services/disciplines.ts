import type {
  DisciplineDTO,
  CreateDisciplineRequest,
  UpdateDisciplineRequest,
  ListDisciplinesFilters,
} from '@alentapp/shared';

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

  async list(filters: ListDisciplinesFilters = {}): Promise<DisciplineDTO[]> {
    const params = new URLSearchParams();
    if (filters.member_id) params.set('member_id', filters.member_id);
    if (filters.status) params.set('status', filters.status);
    if (filters.sort_desc !== undefined) params.set('sort_desc', String(filters.sort_desc));

    const qs = params.toString();
    const response = await fetch(`${API_URL}/disciplines${qs ? `?${qs}` : ''}`);
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Error al obtener las sanciones');
    }
    return response.json();
  },

  async update(id: string, data: UpdateDisciplineRequest): Promise<DisciplineDTO> {
    const response = await fetch(`${API_URL}/disciplines/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Error al actualizar la sanción');
    }
    return response.json();
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/disciplines/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Error al eliminar la sanción');
    }
  },
};
