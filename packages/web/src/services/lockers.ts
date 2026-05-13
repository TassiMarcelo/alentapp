import type { LockerDTO, CreateLockerRequest, GetLockersFilters } from '@alentapp/shared';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/api/v1';

export const lockersService = {
  async create(data: CreateLockerRequest): Promise<LockerDTO> {
    const response = await fetch(`${API_URL}/lockers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Error al crear el locker');
    }
    return response.json();
  },

  async getAll(filters?: GetLockersFilters): Promise<LockerDTO[]> {
    const params = new URLSearchParams();
    if (filters?.estado) params.set('estado', filters.estado);
    if (filters?.ubicacion) params.set('ubicacion', filters.ubicacion);

    const url = `${API_URL}/lockers${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url);
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Error al obtener los lockers');
    }
    return response.json();
},
};

