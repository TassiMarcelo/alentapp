import { LockerDTO, UpdateLockerRequest, LockerUbicacion } from '@alentapp/shared';
import { LockerRepository } from '../domain/LockerRepository.js';

const UBICACIONES_VALIDAS: LockerUbicacion[] = ['VESTUARIO_MASCULINO', 'VESTUARIO_FEMENINO', 'NINOS'];

export class UpdateLockerUseCase {
    constructor(private readonly lockerRepository: LockerRepository) {}

    async execute(id: string, data: UpdateLockerRequest): Promise<LockerDTO> {
        if (!data.numero && !data.ubicacion) {
            throw new Error('Debe enviar al menos un campo a modificar');
        }

        if (data.ubicacion && !UBICACIONES_VALIDAS.includes(data.ubicacion)) {
            throw new Error('Ubicación inválida');
        }

        const locker = await this.lockerRepository.findById(id);
        if (!locker) {
            throw new Error('El locker no existe');
        }

        if (locker.estado === 'OCUPADO') {
            throw new Error('No se puede modificar un locker que está ocupado');
        }

        if (data.numero && data.numero !== locker.numero) {
            const existing = await this.lockerRepository.findByNumero(data.numero);
            if (existing) {
                throw new Error('Ya existe un locker con ese número');
            }
        }

        return this.lockerRepository.update(id, data);
    }
}