import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeleteDisciplineUseCase } from './DeleteDisciplineUseCase.js';
import { DisciplineRepository } from '../domain/DisciplineRepository.js';

describe('DeleteDisciplineUseCase', () => {
  const mockDisciplineRepo = {
    findById: vi.fn(),
    softDelete: vi.fn(),
    create: vi.fn(),
    findAll: vi.fn(),
    update: vi.fn(),
  } as unknown as DisciplineRepository;

  const useCase = new DeleteDisciplineUseCase(mockDisciplineRepo);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe invocar softDelete con el id cuando la sanción existe (TDD-0009)', async () => {
    vi.mocked(mockDisciplineRepo.findById).mockResolvedValue({
      id: 'discipline-uuid-1',
      reason: 'Falta grave',
      start_date: '2026-06-01T00:00:00Z',
      end_date: '2026-06-30T00:00:00Z',
      is_total_suspension: true,
      member_id: 'member-uuid-1',
    });

    await useCase.execute('discipline-uuid-1');

    expect(mockDisciplineRepo.findById).toHaveBeenCalledWith('discipline-uuid-1');
    expect(mockDisciplineRepo.softDelete).toHaveBeenCalledWith('discipline-uuid-1');
  });

  it('debe rechazar con `La sanción indicada no existe` cuando findById devuelve null (TDD-0009)', async () => {
    vi.mocked(mockDisciplineRepo.findById).mockResolvedValue(null);

    await expect(useCase.execute('discipline-inexistente')).rejects.toThrow(
      'La sanción indicada no existe',
    );

    expect(mockDisciplineRepo.findById).toHaveBeenCalledWith('discipline-inexistente');
    expect(mockDisciplineRepo.softDelete).not.toHaveBeenCalled();
  });
});
