import { MedicalCertificateDTO, UpdateMedicalCertificateRequest } from '@alentapp/shared';

// Datos de dominio para persistir un certificado (snake_case, ya validado/mapeado)
export interface NewMedicalCertificate {
  member_id: string;
  issue_date: string;
  expiry_date: string;
  doctor_license: string;
  is_validated: boolean;
}

// Cliente transaccional opaco (Prisma.TransactionClient) para garantizar atomicidad
export type TxClient = unknown;

export interface MedicalCertificateRepository {
  // TDD-0018 §Domain: invalida todos los certificados previos vigentes del socio
  invalidateAllByMemberId(memberId: string, tx?: TxClient): Promise<void>;
  // TDD-0018 §Application: persiste el nuevo certificado
  save(data: NewMedicalCertificate, tx?: TxClient): Promise<MedicalCertificateDTO>;
  // TDD-0018 §Observaciones: ejecuta invalidación + alta dentro de una transacción ($transaction)
  runInTransaction<T>(work: (tx: TxClient) => Promise<T>): Promise<T>;

  findByMemberId(memberId: string): Promise<MedicalCertificateDTO[]>;
  findAll(): Promise<MedicalCertificateDTO[]>;
  findById(id: string): Promise<MedicalCertificateDTO | null>;
  // TDD-0019: edición parcial; tx opcional para invalidar previos + actualizar de forma atómica
  update(id: string, data: UpdateMedicalCertificateRequest, tx?: TxClient): Promise<MedicalCertificateDTO>;
  delete(id: string): Promise<void>; // TDD-0020
}
