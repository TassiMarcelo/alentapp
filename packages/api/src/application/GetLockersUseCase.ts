import { LockerDTO, GetLockersFilters, LockerEstado, LockerUbicacion } from '@alentapp/shared';
import { LockerRepository } from '../domain/LockerRepository.js';

const VALID_ESTADOS: LockerEstado[] = ['DISPONIBLE', 'OCUPADO', 'MANTENIMIENTO'];
const VALID_UBICACIONES: LockerUbicacion[] = ['VESTUARIO_MASCULINO', 'VESTUARIO_FEMENINO', 'NINOS'];

export class GetLockersUseCase {
    constructor(private readonly lockerRepository: LockerRepository) {}

    async execute(filters?: GetLockersFilters): Promise<LockerDTO[]> {
        if (filters?.estado && !VALID_ESTADOS.includes(filters.estado)) {
            throw new Error('Filtro inválido');
        }
        if (filters?.ubicacion && !VALID_UBICACIONES.includes(filters.ubicacion)) {
            throw new Error('Filtro inválido');
        }

        return this.lockerRepository.findAll(filters);
    }
}