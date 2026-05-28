import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeleteSportUseCase } from './DeleteSportUseCase.js';
import { SportRepository } from '../domain/SportRepository.js';

describe('DeleteSportUseCase', () => {
  const mockSportRepo = {
    findById: vi.fn(),
    delete: vi.fn(),
  } as unknown as SportRepository;

  const useCase = new DeleteSportUseCase(mockSportRepo);

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

  it('debe eliminar el deporte correctamente si existe', async () => {
    vi.mocked(mockSportRepo.findById).mockResolvedValueOnce(existingSport);
    vi.mocked(mockSportRepo.delete).mockResolvedValueOnce(undefined);

    await useCase.execute('sport-uuid-1');

    expect(mockSportRepo.findById).toHaveBeenCalledWith('sport-uuid-1');
    expect(mockSportRepo.delete).toHaveBeenCalledWith('sport-uuid-1');
  });

  it('debe lanzar error si el deporte no existe', async () => {
    vi.mocked(mockSportRepo.findById).mockResolvedValueOnce(null);

    await expect(useCase.execute('sport-uuid-inexistente')).rejects.toThrow(
      'El deporte ya ha sido eliminado o no existe',
    );
    expect(mockSportRepo.delete).not.toHaveBeenCalled();
  });
});