import type { MedicalCertificateDTO, CreateMedicalCertificateRequest } from '@alentapp/shared';

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
  async getAll(): Promise<MedicalCertificateDTO[]> {
    const response = await fetch(`${API_URL}/medical-certificates`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || err.error || 'Error al cargar los certificados médicos');
    }
    return response.json();
  },
};
