// ==========================================
// Pagination (TDD-0025)
// ==========================================
export interface PaginationParams {
  page?: number;       // base 1, default 1
  page_size?: number;  // default 20, min 1, max 100
}

export interface PaginationMeta {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface Paginated<T> {
  data: T[];
  pagination: PaginationMeta;
}

// ==========================================
// Member
// ==========================================
export type MemberCategory = 'Pleno' | 'Cadete' | 'Honorario';
export type MemberStatus = 'Activo' | 'Moroso' | 'Suspendido';

export interface MemberDTO {
  id: string; // UUID
  dni: string;
  name: string;
  email: string;
  birthdate: string; // ISO Date String (YYYY-MM-DD)
  category: MemberCategory;
  status: MemberStatus;
  created_at: string; // ISO Date String
}

export interface CreateMemberRequest {
  dni: string;
  name: string;
  email: string;
  birthdate: string; // ISO Date String (YYYY-MM-DD)
  category: MemberCategory;
}

export interface UpdateMemberRequest {
  dni?: string;
  name?: string;
  email?: string;
  birthdate?: string; // ISO Date String (YYYY-MM-DD)
  category?: MemberCategory;
  status?: MemberStatus;
}


// ==========================================
// Locker
// ==========================================
export type LockerEstado = 'DISPONIBLE' | 'OCUPADO' | 'MANTENIMIENTO';
export type LockerUbicacion = 'VESTUARIO_MASCULINO' | 'VESTUARIO_FEMENINO' | 'NINOS';

export interface LockerDTO {
  id: string;
  numero: number;
  ubicacion: LockerUbicacion;
  estado: LockerEstado;
  fechaFinContrato: string | null;
  socio: { nombre: string; dni: string } | null;
}

export interface CreateLockerRequest {
  numero: number;
  ubicacion: LockerUbicacion;
}

// ==========================================
// Sport
// ==========================================
export interface SportDTO {
  id: string;
  nombre: string;
  descripcion: string;
  cupoMaximo: number;
  precioAdicional: number;
  esFederado: boolean;
  requires_medical_certificate: boolean;
}

export interface CreateSportRequest {
  nombre: string;
  descripcion: string;
  cupoMaximo: number;
  precioAdicional: number;
  esFederado: boolean;
  requires_medical_certificate: boolean;
}

export interface UpdateSportRequest {
  descripcion?: string;
  cupoMaximo?: number;
}

export interface GetLockersFilters extends PaginationParams {
  estado?: LockerEstado;
  ubicacion?: LockerUbicacion;
}

export interface GetMembersFilters extends PaginationParams {}
export interface GetSportsFilters extends PaginationParams {}
export interface GetMedicalCertificatesFilters extends PaginationParams {}
export interface GetPaymentsFilters extends PaginationParams {}

export interface UpdateLockerEstadoRequest {
  estado: LockerEstado;
  memberId?: string;
  fechaFinContrato?: string; // "YYYY-MM-DD"
}

export interface UpdateLockerRequest {
  numero?: number;
  ubicacion?: LockerUbicacion;
}


// ==========================================
// Discipline
// ==========================================
export interface DisciplineDTO {
  id: string;
  reason: string;
  start_date: string; // ISO DateTime
  end_date: string;   // ISO DateTime
  is_total_suspension: boolean;
  member_id: string;
}

export interface CreateDisciplineRequest {
  reason: string;
  start_date: string; // ISO DateTime (YYYY-MM-DDTHH:mm:ssZ)
  end_date: string;
  is_total_suspension: boolean;
  member_id: string;
}

export interface UpdateDisciplineRequest {
  reason?: string;
  start_date?: string; // ISO DateTime
  end_date?: string;   // ISO DateTime
  is_total_suspension?: boolean;
}

export type DisciplineStatus = 'active' | 'expired' | 'upcoming';

export interface ListDisciplinesFilters extends PaginationParams {
  member_id?: string;
  status?: DisciplineStatus;
  sort_desc?: boolean;
}


// ==========================================
// MedicalCertificate
// ==========================================

// Entidad de dominio (TDD-0018 §Modelo de Dominio) — snake_case
export interface MedicalCertificateDTO {
  id: string;            // UUID
  member_id: string;
  issue_date: string;    // ISO Date String (YYYY-MM-DD)
  expiry_date: string;   // ISO Date String (YYYY-MM-DD)
  doctor_license: string;
  is_validated: boolean;
  created_at: string;    // ISO DateTime
  deleted_at?: string | null; // ISO DateTime — null si vigente (TDD-0020 §Modelo de Datos)
}

// Contrato de API (TDD-0018 §Contrato de API) — camelCase
export interface CreateMedicalCertificateRequest {
  issueDate: string;     // "YYYY-MM-DD"
  expiryDate: string;    // "YYYY-MM-DD"
  doctorLicense: string;
  memberId: string;
}

// Contrato de API (TDD-0019 §Contrato de API) — camelCase, edición parcial
export interface UpdateMedicalCertificateRequest {
  issueDate?: string;     // "YYYY-MM-DD"
  expiryDate?: string;    // "YYYY-MM-DD"
  doctorLicense?: string;
  isValidated?: boolean;
}

// ==========================================
// Payment
// ==========================================

export type PaymentStatus = 'Pendiente' | 'Pagado' | 'Cancelado';

export interface PaymentDTO {
  id: string; // UUID
  memberId: string;
  monto: number;
  mesReferencia: number; // 1 - 12
  anioReferencia: number; // YYYY
  fechaVencimiento: string; // ISO Date String
  estado: PaymentStatus;
  fechaPago?: string; // ISO Date String (opcional)
  created_at: string; // ISO Date String
}

export interface CreatePaymentRequest {
  memberId: string;
  monto: number;
  mesReferencia: number;
  anioReferencia: number;
  fechaVencimiento: string; // ISO Date String
}

export interface UpdatePaymentRequest {
  monto?: number;
  fechaVencimiento?: string; // ISO Date String
}

export interface PayPaymentRequest {
  fechaPago: string; // ISO Date String
}