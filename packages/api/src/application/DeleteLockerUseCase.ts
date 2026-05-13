import { LockerRepository } from '../domain/LockerRepository.js';

export class DeleteLockerUseCase {
    constructor(private readonly lockerRepository: LockerRepository) {}

    async execute(id: string): Promise<void> {
        if (!id || id.trim() === '') {
            throw new Error('El id ingresado no es válido');
        }

        const locker = await this.lockerRepository.findById(id);
        if (!locker) {
            throw new Error('El locker no existe');
        }

        if (locker.estado === 'OCUPADO') {
            throw new Error('No se puede eliminar un locker que está ocupado');
        }

        await this.lockerRepository.delete(id);
    }
}