import { SportRepository } from '../domain/SportRepository.js';
import { SportValidator } from '../domain/services/SportValidator.js';
import { SportDTO, UpdateSportRequest } from '@alentapp/shared';

export class UpdateSportUseCase {
    constructor(
        private readonly sportRepo: SportRepository,
        private readonly sportValidator: SportValidator
    ) {}

    async execute(id: string, data: UpdateSportRequest): Promise<SportDTO> {
        // Validar existencia
        const existingSport = await this.sportRepo.findById(id);
        if (!existingSport) {
            throw new Error('El deporte solicitado no existe');
        }

        // Bloquear actualización de nombre 
        if ('nombre' in data) {
            throw new Error('El nombre del deporte no es modificable');
        }

        // Validar cupo
        if (data.cupoMaximo !== undefined) {
            const inscriptosActualmente = await this.sportRepo.countEnrolledMembers(id);
            this.sportValidator.validateCupoMaximo(data.cupoMaximo, inscriptosActualmente);
        }

        // Actualizar
        const updateData = {
            descripcion: data.descripcion ?? existingSport.descripcion,
            cupoMaximo: data.cupoMaximo ?? existingSport.cupoMaximo,
        };

        return this.sportRepo.update(id, updateData);
    }
}
