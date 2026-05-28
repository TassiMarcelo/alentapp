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
    //sin filtro
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

    // sin lockers
    it('debe devolver array vacío si no hay lockers', async () => {
    vi.mocked(mockLockerRepo.findAll).mockResolvedValueOnce([]);

    const result = await useCase.execute();

    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
    });
    //estado invalido
    it('debe lanzar error si el estado es inválido', async () => {
    await expect(useCase.execute({ estado: 'INVALIDO' as any }))
        .rejects.toThrow('Filtro inválido');
    });
    
    //ubicacion invalida
    it('debe lanzar error si la ubicación es inválida', async () => {
        await expect(useCase.execute({ ubicacion: 'INVALIDA' as any }))
            .rejects.toThrow('Filtro inválido');
    });

    //estado valido
    it('debe devolver lockers filtrados por estado válido', async () => {
    const mockLockers = [
        { id: 'uuid-1', numero: 1, ubicacion: 'VESTUARIO_MASCULINO', estado: 'DISPONIBLE', fechaFinContrato: null, socio: null },
    ];
    vi.mocked(mockLockerRepo.findAll).mockResolvedValueOnce(mockLockers as any);

    const result = await useCase.execute({ estado: 'DISPONIBLE' });

    expect(mockLockerRepo.findAll).toHaveBeenCalledWith({ estado: 'DISPONIBLE' });
    expect(result).toHaveLength(1);
    expect(result[0].estado).toBe('DISPONIBLE');
    });

    //ubicacion valida
    it('debe devolver lockers filtrados por ubicación válida', async () => {
    const mockLockers = [
        { id: 'uuid-1', numero: 1, ubicacion: 'NINOS', estado: 'DISPONIBLE', fechaFinContrato: null, socio: null },
    ];
    vi.mocked(mockLockerRepo.findAll).mockResolvedValueOnce(mockLockers as any);

    const result = await useCase.execute({ ubicacion: 'NINOS' });

    expect(mockLockerRepo.findAll).toHaveBeenCalledWith({ ubicacion: 'NINOS' });
    expect(result).toHaveLength(1);
    expect(result[0].ubicacion).toBe('NINOS');
    });

});