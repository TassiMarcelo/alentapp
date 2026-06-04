import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ListDisciplinesUseCase } from './ListDisciplinesUseCase.js';
import { DisciplineRepository } from '../domain/DisciplineRepository.js';

describe('ListDisciplinesUseCase', () => {
  const mockDisciplineRepo = {
    findAll: vi.fn(),
  } as unknown as DisciplineRepository;

  const useCase = new ListDisciplinesUseCase(mockDisciplineRepo);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(mockDisciplineRepo.findAll).mockResolvedValue([]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debe aplicar sort_desc=true por default cuando no viene en los filtros (TDD-0010)', async () => {
    await useCase.execute({});

    expect(mockDisciplineRepo.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ sort_desc: true }),
    );
  });

  it('debe inyectar at = new Date() cuando se filtra por status', async () => {
    const frozenNow = new Date('2026-05-26T12:00:00Z');
    vi.useFakeTimers();
    vi.setSystemTime(frozenNow);

    await useCase.execute({ status: 'active' });

    expect(mockDisciplineRepo.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'active',
        at: frozenNow,
      }),
    );
  });

  it('debe omitir at (undefined) cuando no hay filtro de status', async () => {
    await useCase.execute({ member_id: 'member-uuid-1' });

    const call = vi.mocked(mockDisciplineRepo.findAll).mock.calls[0]![0];
    expect(call.at).toBeUndefined();
    expect(call.member_id).toBe('member-uuid-1');
  });
});
