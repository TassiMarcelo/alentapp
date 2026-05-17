import type {
  CreatePaymentRequest,
  PaymentDTO,
  PayPaymentRequest,
} from '../types/payment';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/api/v1/payments';

export const paymentsService = {
  async getAll(): Promise<PaymentDTO[]> {
    const res = await fetch(API_URL);
    const json = await res.json();
    return json.data;
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