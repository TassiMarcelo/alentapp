import {
  PaymentDTO,
  CreatePaymentRequest,
  UpdatePaymentRequest,
  PaymentStatus
} from '@alentapp/shared';

// Puerto de salida para Payment
// El dominio define qué necesita, sin importar la implementación (Prisma)

export interface PaymentRepository {

  // Crear un nuevo pago
  create(
    payment: CreatePaymentRequest & {
      estado: PaymentStatus;
      created_at: string;
    }
  ): Promise<PaymentDTO>;

  // Buscar por ID
  findById(id: string): Promise<PaymentDTO | null>;

  // Buscar pagos por socio + periodo (para evitar duplicados / idempotencia)
  findByMemberAndPeriod(
    memberId: string,
    mesReferencia: number,
    anioReferencia: number
  ): Promise<PaymentDTO | null>;

  // Obtener todos los pagos
  findAll(): Promise<PaymentDTO[]>;

  // Actualizar (update, cancel, pay usan este)
  update(
    id: string,
    data: Partial<PaymentDTO>
  ): Promise<PaymentDTO>;
}