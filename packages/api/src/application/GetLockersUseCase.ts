import { LockerDTO, GetLockersFilters, LockerEstado, LockerUbicacion, Paginated } from '@alentapp/shared';
import { LockerRepository } from '../domain/LockerRepository.js';
import { applyPagination, buildPaginated } from './shared/paginate.js';

const VALID_ESTADOS: LockerEstado[] = ['DISPONIBLE', 'OCUPADO', 'MANTENIMIENTO'];
const VALID_UBICACIONES: LockerUbicacion[] = ['VESTUARIO_MASCULINO', 'VESTUARIO_FEMENINO', 'NINOS'];

export class GetLockersUseCase {
    constructor(private readonly lockerRepository: LockerRepository) {}

    async execute(filters?: GetLockersFilters): Promise<Paginated<LockerDTO>> {
        if (filters?.estado && !VALID_ESTADOS.includes(filters.estado)) {
            throw new Error('Filtro inválido');
        }
        if (filters?.ubicacion && !VALID_UBICACIONES.includes(filters.ubicacion)) {
            throw new Error('Filtro inválido');
        }

        const { page, page_size } = applyPagination(filters);
        const { data, total } = await this.lockerRepository.findAll({ ...filters, page, page_size });
        return buildPaginated({ page, page_size, total, data });
    }
}
