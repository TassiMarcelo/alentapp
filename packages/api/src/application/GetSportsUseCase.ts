import { SportRepository } from '../domain/SportRepository.js';
import { SportDTO } from '@alentapp/shared';

export class GetSportsUseCase {
    constructor(private readonly sportRepo: SportRepository) {}

    async execute(): Promise<SportDTO[]> {
        return this.sportRepo.getAll();
    }
}
