import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdateDisciplineUseCase } from './UpdateDisciplineUseCase.js';
import { DisciplineRepository } from '../domain/DisciplineRepository.js';
import { DisciplineValidator } from '../domain/services/DisciplineValidator.js';

describe('UpdateDisciplineUseCase', () => {
  const mockDisciplineRepo = {
    findById: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
    findAll: vi.fn(),
    softDelete: vi.fn(),
  } as unknown as DisciplineRepository;

  const validator = new DisciplineValidator();
  const useCase = new UpdateDisciplineUseCase(mockDisciplineRepo, validator);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe rechazar con `Debe enviarse al menos un campo a actualizar` cuando el body está vacío (TDD-0008)', async () => {
    await expect(useCase.execute('discipline-uuid-1', {})).rejects.toThrow(
      'Debe enviarse al menos un campo a actualizar',
    );
    expect(mockDisciplineRepo.findById).not.toHaveBeenCalled();
    expect(mockDisciplineRepo.update).not.toHaveBeenCalled();
  });

  it('debe rechazar con `La sanción indicada no existe` cuando findById devuelve null', async () => {
    vi.mocked(mockDisciplineRepo.findById).mockResolvedValue(null);

    await expect(
      useCase.execute('discipline-inexistente', { reason: 'Nuevo motivo' }),
    ).rejects.toThrow('La sanción indicada no existe');

    expect(mockDisciplineRepo.findById).toHaveBeenCalledWith('discipline-inexistente');
    expect(mockDisciplineRepo.update).not.toHaveBeenCalled();
  });

  it('debe revalidar fechas combinando el start_date existente con un end_date nuevo anterior (TDD-0008)', async () => {
    vi.mocked(mockDisciplineRepo.findById).mockResolvedValue({
      id: 'discipline-uuid-1',
      reason: 'Falta original',
      start_date: '2026-06-01T00:00:00Z',
      end_date: '2026-06-30T00:00:00Z',
      is_total_suspension: false,
      member_id: 'member-uuid-1',
    });

    await expect(
      useCase.execute('discipline-uuid-1', { end_date: '2026-05-15T00:00:00Z' }),
    ).rejects.toThrow('La fecha de fin debe ser posterior a la de inicio');

    expect(mockDisciplineRepo.update).not.toHaveBeenCalled();
  });
});
