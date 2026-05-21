import type {
  CreatePaymentRequest,
  PaymentDTO,
  PayPaymentRequest,
  UpdatePaymentRequest,
} from '../types/payment';
import type { Paginated, PaginationParams } from '@alentapp/shared';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/api/v1/payments';

export const paymentsService = {
  async getAll(params?: PaginationParams): Promise<Paginated<PaymentDTO>> {
    const search = new URLSearchParams();
    if (params?.page) search.set('page', String(params.page));
    if (params?.page_size) search.set('page_size', String(params.page_size));
    const qs = search.toString();
    const res = await fetch(`${API_URL}${qs ? `?${qs}` : ''}`);
    return res.json();
  },

  async create(data: CreatePaymentRequest): Promise<PaymentDTO> {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const json = await res.json();

    if (!res.ok) {
      throw new Error(json.error || 'Error creando pago');
    }

    return json.data;
  },

  async update(id: string, data: UpdatePaymentRequest): Promise<PaymentDTO> {
    const res = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const json = await res.json();

    if (!res.ok) {
      throw new Error(json.error || 'Error actualizando pago');
    }

    return json.data;
  },

  async cancel(id: string): Promise<PaymentDTO> {
    const res = await fetch(`${API_URL}/${id}/cancel`, {
      method: 'PATCH',
    });

    const json = await res.json();

    if (!res.ok) {
      throw new Error(json.error || 'Error cancelando pago');
    }

    return json.data;
  },

  async pay(id: string): Promise<PaymentDTO> {
    const body: PayPaymentRequest = {
      fechaPago: new Date().toISOString(),
    };

    const res = await fetch(`${API_URL}/${id}/pay`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const json = await res.json();

    if (!res.ok) {
      throw new Error(json.error || 'Error pagando pago');
    }

    return json.data;
  },
};