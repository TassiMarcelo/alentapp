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

export interface GetLockersFilters {
  estado?: LockerEstado;
  ubicacion?: LockerUbicacion;
}

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