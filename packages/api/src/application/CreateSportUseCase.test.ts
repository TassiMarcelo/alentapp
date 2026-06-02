import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateSportUseCase } from './CreateSportUseCase.js';
import { SportRepository } from '../domain/SportRepository.js';
import { CreateSportRequest } from '@alentapp/shared';

describe('CreateSportUseCase', () => {
  const mockSportRepo = {
    create: vi.fn(),
    findByName: vi.fn(),
  } as unknown as SportRepository;

  const useCase = new CreateSportUseCase(mockSportRepo);

  const baseRequest: CreateSportRequest = {
    nombre: 'Basquet',
    descripcion: 'Deporte de equipo con pelota y canasta',
    cupoMaximo: 20,
    precioAdicional: 500,
    esFederado: false,
    requires_medical_certificate: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe crear un deporte exitosamente con datos válidos', async () => {
    vi.mocked(mockSportRepo.findByName).mockResolvedValueOnce(null);
    vi.mocked(mockSportRepo.create).mockResolvedValueOnce({
      id: 'sport-uuid-1',
      ...baseRequest,
    });

    const result = await useCase.execute(baseRequest);

    expect(mockSportRepo.findByName).toHaveBeenCalledWith('Basquet');
    expect(mockSportRepo.create).toHaveBeenCalledWith(baseRequest);
    expect(result.id).toBe('sport-uuid-1');
    expect(result.nombre).toBe('Basquet');
  });

  it('debe lanzar error si el nombre está vacío (" ")', async () => {
    const request: CreateSportRequest = { ...baseRequest, nombre: '   ' };

    await expect(useCase.execute(request)).rejects.toThrow(
      'El nombre del deporte no puede estar vacío',
    );
    expect(mockSportRepo.create).not.toHaveBeenCalled();
  });

  it('debe lanzar error si cupoMaximo es 0 o negativo', async () => {
    const requestCero: CreateSportRequest = { ...baseRequest, cupoMaximo: 0 };
    const requestNegativo: CreateSportRequest = { ...baseRequest, cupoMaximo: -5 };

    await expect(useCase.execute(requestCero)).rejects.toThrow(
      'El cupo máximo debe ser mayor a cero',
    );
    await expect(useCase.execute(requestNegativo)).rejects.toThrow(
      'El cupo máximo debe ser mayor a cero',
    );
    expect(mockSportRepo.create).not.toHaveBeenCalled();
  });

  it('debe lanzar error si ya existe un deporte con ese nombre (→ 409)', async () => {
    vi.mocked(mockSportRepo.findByName).mockResolvedValueOnce({
      id: 'sport-uuid-existente',
      nombre: 'Basquet',
      descripcion: 'Deporte de equipo con pelota y canasta',
      cupoMaximo: 20,
      precioAdicional: 500,
      esFederado: false,
      requires_medical_certificate: true,
    });

    await expect(useCase.execute(baseRequest)).rejects.toThrow(
      'Ya existe un deporte con ese nombre',
    );
    expect(mockSportRepo.create).not.toHaveBeenCalled();
  });
});