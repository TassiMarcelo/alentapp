import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetLockersUseCase } from './GetLockersUseCase.js';
import { LockerRepository } from '../domain/LockerRepository.js';

describe('GetLockersUseCase', () => {
    const mockLockerRepo = {
        findAll: vi.fn(),
    } as unknown as LockerRepository;

    const useCase = new GetLockersUseCase(mockLockerRepo);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('debe devolver todos los lockers sin filtros', async () => {
        const mockLockers = [
            { id: 'uuid-1', numero: 1, ubicacion: 'VESTUARIO_MASCULINO', estado: 'DISPONIBLE', fechaFinContrato: null, socio: null },
            { id: 'uuid-2', numero: 2, ubicacion: 'NINOS', estado: 'OCUPADO', fechaFinContrato: '2026-12-01', socio: { nombre: 'Juan', dni: '12345678' } },
        ];
        vi.mocked(mockLockerRepo.findAll).mockResolvedValueOnce(mockLockers as any);

        const result = await useCase.execute();

        expect(mockLockerRepo.findAll).toHaveBeenCalledWith(undefined);
        expect(result).toHaveLength(2);
    });


    it('debe devolver array vacío si no hay lockers', async () => {
    vi.mocked(mockLockerRepo.findAll).mockResolvedValueOnce([]);

    const result = await useCase.execute();

    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
    });

    it('debe lanzar error si el estado es inválido', async () => {
    await expect(useCase.execute({ estado: 'INVALIDO' as any }))
        .rejects.toThrow('Filtro inválido');
    });

    it('debe lanzar error si la ubicación es inválida', async () => {
        await expect(useCase.execute({ ubicacion: 'INVALIDA' as any }))
            .rejects.toThrow('Filtro inválido');
    });

});