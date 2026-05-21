import type { MemberDTO, CreateMemberRequest, Paginated, PaginationParams } from '@alentapp/shared';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/api/v1';

export const membersService = {
  async getAll(params?: PaginationParams): Promise<Paginated<MemberDTO>> {
    const search = new URLSearchParams();
    if (params?.page) search.set('page', String(params.page));
    if (params?.page_size) search.set('page_size', String(params.page_size));
    const qs = search.toString();
    const response = await fetch(`${API_URL}/socios${qs ? `?${qs}` : ''}`);
    if (!response.ok) {
      throw new Error('Error al obtener los miembros');
    }
    return response.json();
  },

  async create(data: CreateMemberRequest): Promise<MemberDTO> {
    const response = await fetch(`${API_URL}/socios`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al crear el miembro');
    }
    const result = await response.json();
    return result.data;
  },

  async update(id: string, data: Partial<CreateMemberRequest> & { status?: string }): Promise<MemberDTO> {
    const response = await fetch(`${API_URL}/socios/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al actualizar el miembro');
    }
    const result = await response.json();
    return result.data;
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/socios/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al eliminar el miembro');
    }
  },
};
