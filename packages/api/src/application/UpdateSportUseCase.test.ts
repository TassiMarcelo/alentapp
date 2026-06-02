import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdateSportUseCase } from './UpdateSportUseCase.js';
import { SportRepository } from '../domain/SportRepository.js';
import { SportValidator } from '../domain/services/SportValidator.js';
import { UpdateSportRequest } from '@alentapp/shared';

describe('UpdateSportUseCase', () => {
  const mockSportRepo = {
    findById: vi.fn(),
    update: vi.fn(),
    countEnrolledMembers: vi.fn(),
  } as unknown as SportRepository;

  const mockSportValidator = {
    validateCupoMaximo: vi.fn(),
  } as unknown as SportValidator;

  const useCase = new UpdateSportUseCase(mockSportRepo, mockSportValidator);

  const existingSport = {
    id: 'sport-uuid-1',
    nombre: 'Basquet',
    descripcion: 'Deporte de equipo con pelota y canasta',
    cupoMaximo: 20,
    precioAdicional: 1000,
    esFederado: false,
    requires_medical_certificate: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe actualizar descripcion y cupoMaximo exitosamente', async () => {
    const request: UpdateSportRequest = {
      descripcion: 'Nueva descripción',
      cupoMaximo: 30,
    };

    vi.mocked(mockSportRepo.findById).mockResolvedValueOnce(existingSport);
    vi.mocked(mockSportRepo.countEnrolledMembers).mockResolvedValueOnce(5);
    vi.mocked(mockSportRepo.update).mockResolvedValueOnce({
      ...existingSport,
      descripcion: 'Nueva descripción',
      cupoMaximo: 30,
    });

    const result = await useCase.execute('sport-uuid-1', request);

    expect(mockSportRepo.findById).toHaveBeenCalledWith('sport-uuid-1');
    expect(mockSportValidator.validateCupoMaximo).toHaveBeenCalledWith(30, 5);
    expect(mockSportRepo.update).toHaveBeenCalledWith('sport-uuid-1', {
      descripcion: 'Nueva descripción',
      cupoMaximo: 30,
    });
    expect(result.descripcion).toBe('Nueva descripción');
    expect(result.cupoMaximo).toBe(30);
  });

  it('debe lanzar error si se intenta modificar el nombre', async () => {
    const request = { nombre: 'basquett' } as unknown as UpdateSportRequest;

    vi.mocked(mockSportRepo.findById).mockResolvedValueOnce(existingSport);

    await expect(useCase.execute('sport-uuid-1', request)).rejects.toThrow(
      'El nombre del deporte no es modificable',
    );
    expect(mockSportRepo.update).not.toHaveBeenCalled();
  });
});