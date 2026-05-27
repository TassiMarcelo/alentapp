import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetSportsUseCase } from './GetSportsUseCase.js';
import { SportRepository } from '../domain/SportRepository.js';
import { SportDTO } from '@alentapp/shared';

describe('GetSportsUseCase', () => {
  const mockSportRepo = {
    getAll: vi.fn(),
  } as unknown as SportRepository;

  const useCase = new GetSportsUseCase(mockSportRepo);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe retornar la lista de deportes del repositorio', async () => {
    const mockSports: SportDTO[] = [
      {
        id: 'sport-uuid-1',
        nombre: 'Basquet',
        descripcion: 'Deporte de equipo con pelota y canasta',
        cupoMaximo: 20,
        precioAdicional: 1000,
        esFederado: false,
        requires_medical_certificate: true,
      },
      {
        id: 'sport-uuid-2',
        nombre: 'Tenis',
        descripcion: 'Deporte de raqueta individual o por parejas',
        cupoMaximo: 10,
        precioAdicional: 1500,
        esFederado: true,
        requires_medical_certificate: false,
      },
    ];

    vi.mocked(mockSportRepo.getAll).mockResolvedValueOnce(mockSports);

    const result = await useCase.execute();

    expect(mockSportRepo.getAll).toHaveBeenCalledOnce();
    expect(result).toHaveLength(2);
    expect(result[0].nombre).toBe('Basquet');
    expect(result[1].nombre).toBe('Tenis');
  });

  it('debe retornar array vacío si no hay deportes registrados', async () => {
    vi.mocked(mockSportRepo.getAll).mockResolvedValueOnce([]);

    const result = await useCase.execute();

    expect(mockSportRepo.getAll).toHaveBeenCalledOnce();
    expect(result).toEqual([]);
  });
});