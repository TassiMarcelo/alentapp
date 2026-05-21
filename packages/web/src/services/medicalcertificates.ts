import type {
  MedicalCertificateDTO,
  CreateMedicalCertificateRequest,
  UpdateMedicalCertificateRequest,
  Paginated,
  PaginationParams,
} from '@alentapp/shared';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/api/v1';

export const medicalCertificatesService = {
  async create(data: CreateMedicalCertificateRequest): Promise<MedicalCertificateDTO> {
    const response = await fetch(`${API_URL}/medical-certificates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || err.error || 'Error al registrar el certificado médico');
    }
    return response.json();
  },
  async getAll(params?: PaginationParams): Promise<Paginated<MedicalCertificateDTO>> {
    const search = new URLSearchParams();
    if (params?.page) search.set('page', String(params.page));
    if (params?.page_size) search.set('page_size', String(params.page_size));
    const qs = search.toString();
    const response = await fetch(`${API_URL}/medical-certificates${qs ? `?${qs}` : ''}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || err.error || 'Error al cargar los certificados médicos');
    }
    return response.json();
  },
  async update(
    id: string,
    data: UpdateMedicalCertificateRequest,
  ): Promise<MedicalCertificateDTO> {
    const response = await fetch(`${API_URL}/medical-certificates/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || err.error || 'Error al actualizar el certificado médico');
    }
    return response.json();
  },
  // TDD-0020: borrado lógico. La API responde 204 No Content (sin cuerpo).
  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/medical-certificates/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || err.error || 'Error al eliminar el certificado médico');
    }
  },
};
