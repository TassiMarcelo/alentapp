import { SportRepository } from '../domain/SportRepository.js';
import { SportDTO, CreateSportRequest } from '@alentapp/shared';

export class CreateSportUseCase {
    constructor(private readonly sportRepository: SportRepository) {}

    async execute(data: CreateSportRequest): Promise<SportDTO> {
        if (!data.nombre || data.cupoMaximo === undefined) {
            throw new Error('El nombre y la capacidad máxima son requeridos');
        }

        const nombreLimpio = data.nombre.trim();
        if (nombreLimpio === '') {
            throw new Error('El nombre del deporte no puede estar vacío');
        }
        data.nombre = nombreLimpio;

        if (data.cupoMaximo <= 0) {
            throw new Error('El cupo máximo debe ser mayor a cero');
        }

        const existingSport = await this.sportRepository.findByName(data.nombre);
        if (existingSport) {
            throw new Error('Ya existe un deporte con ese nombre');
        }

        const nuevoSport = await this.sportRepository.create(data);

        return nuevoSport;
    }
}
