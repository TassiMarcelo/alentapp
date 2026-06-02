import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateDisciplineUseCase } from './CreateDisciplineUseCase.js';
import { DisciplineRepository } from '../domain/DisciplineRepository.js';
import { MemberRepository } from '../domain/MemberRepository.js';
import { DisciplineValidator } from '../domain/services/DisciplineValidator.js';
import { CreateDisciplineRequest } from '@alentapp/shared';

describe('CreateDisciplineUseCase', () => {
  const mockDisciplineRepo = {
    create: vi.fn(),
  } as unknown as DisciplineRepository;

  const mockMemberRepo = {
    findById: vi.fn(),
  } as unknown as MemberRepository;

  const mockValidator = {
    validateDates: vi.fn(),
  } as unknown as DisciplineValidator;

  const useCase = new CreateDisciplineUseCase(mockDisciplineRepo, mockMemberRepo, mockValidator);

  const baseRequest: CreateDisciplineRequest = {
    reason: 'Conducta antideportiva',
    start_date: '2026-05-01T00:00:00Z',
    end_date: '2026-05-15T00:00:00Z',
    is_total_suspension: true,
    member_id: 'member-uuid-1',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe crear la sanción exitosamente cuando el socio existe y las fechas son válidas', async () => {
    vi.mocked(mockMemberRepo.findById).mockResolvedValueOnce({ id: 'member-uuid-1' } as any);
    vi.mocked(mockDisciplineRepo.create).mockResolvedValueOnce({
      id: 'discipline-uuid-1',
      ...baseRequest,
    });

    const result = await useCase.execute(baseRequest);

    expect(mockValidator.validateDates).toHaveBeenCalledWith(
      new Date(baseRequest.start_date),
      new Date(baseRequest.end_date),
    );
    expect(mockMemberRepo.findById).toHaveBeenCalledWith('member-uuid-1');
    expect(mockDisciplineRepo.create).toHaveBeenCalledWith(baseRequest);
    expect(result.id).toBe('discipline-uuid-1');
  });

  it('debe rechazar con "El socio indicado no existe" cuando MemberRepository.findById devuelve null', async () => {
    vi.mocked(mockMemberRepo.findById).mockResolvedValueOnce(null);

    await expect(useCase.execute(baseRequest)).rejects.toThrow('El socio indicado no existe');
    expect(mockDisciplineRepo.create).not.toHaveBeenCalled();
  });
});
