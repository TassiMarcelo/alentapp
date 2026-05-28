import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateLockerUseCase } from './CreateLockerUseCase.js';
import { LockerRepository } from '../domain/LockerRepository.js';

describe('CreateLockerUseCase', () => {
    const mockLockerRepo = {
        findByNumero: vi.fn(),
        count: vi.fn(),
        create: vi.fn(),
    } as unknown as LockerRepository;

    const useCase = new CreateLockerUseCase(mockLockerRepo);

    beforeEach(() => {
        vi.clearAllMocks();
    });
    //campos requeridos
    it('debe lanzar error si falta el número', async () => {
        await expect(useCase.execute({ numero: null as any, ubicacion: 'VESTUARIO_MASCULINO' }))
            .rejects.toThrow('Faltan campos requeridos');
    });

    it('debe lanzar error si falta la ubicación', async () => {
        await expect(useCase.execute({ numero: 1, ubicacion: null as any }))
            .rejects.toThrow('Faltan campos requeridos');
    });

    it('debe lanzar error si faltan ambos campos', async () => {
        await expect(useCase.execute({ numero: null as any, ubicacion: null as any }))
            .rejects.toThrow('Faltan campos requeridos');
    });

    // ubicacion no corresponde al enum
    it('debe lanzar error si la ubicación es inválida', async () => {
    await expect(useCase.execute({ numero: 1, ubicacion: 'INVALIDA' as any }))
        .rejects.toThrow('Ubicación inválida');
    });

    // superar 100 lokers
    it('debe lanzar error si ya existen 100 lockers', async () => {
    vi.mocked(mockLockerRepo.count).mockResolvedValueOnce(100);

    await expect(useCase.execute({ numero: 1, ubicacion: 'VESTUARIO_MASCULINO' }))
        .rejects.toThrow('Se alcanzó el límite máximo de lockers');
    });




    // mokeo dos cosas, cantidad de locker 0 y simula un locker existente con numero 1 para probar despeus sombre este numero.
    it('debe lanzar error si el número ya está registrado', async () => {
    vi.mocked(mockLockerRepo.count).mockResolvedValueOnce(0);
    vi.mocked(mockLockerRepo.findByNumero).mockResolvedValueOnce({
        id: 'uuid-1',
        numero: 1,
        ubicacion: 'VESTUARIO_MASCULINO',
        estado: 'DISPONIBLE',
        fechaFinContrato: null,
        socio: null,
    });

    await expect(useCase.execute({ numero: 1, ubicacion: 'VESTUARIO_MASCULINO' }))
        .rejects.toThrow('Ya existe un locker con ese número');
    });


    // creacion correcta 
    it('debe crear el locker exitosamente', async () => {
    vi.mocked(mockLockerRepo.count).mockResolvedValueOnce(0);
    vi.mocked(mockLockerRepo.findByNumero).mockResolvedValueOnce(null);
    vi.mocked(mockLockerRepo.create).mockResolvedValueOnce({
        id: 'uuid-1',
        numero: 1,
        ubicacion: 'VESTUARIO_MASCULINO',
        estado: 'DISPONIBLE',
        fechaFinContrato: null,
        socio: null,
    });

    const result = await useCase.execute({ numero: 1, ubicacion: 'VESTUARIO_MASCULINO' });

    expect(mockLockerRepo.create).toHaveBeenCalledWith({
        numero: 1,
        ubicacion: 'VESTUARIO_MASCULINO',
    });
    expect(result.estado).toBe('DISPONIBLE');
    expect(result.socio).toBeNull();
    });

    

});








        
