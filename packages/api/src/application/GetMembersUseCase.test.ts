import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetMembersUseCase } from './GetMembersUseCase.js';
import { MemberRepository } from '../domain/MemberRepository.js';

describe('GetMembersUseCase', () => {
    const mockMemberRepo = {
        findAll: vi.fn(),
    } as unknown as MemberRepository;

    const useCase = new GetMembersUseCase(mockMemberRepo);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('debe retornar la lista paginada de miembros', async () => {
        const mockMembers = [{ id: '1', name: 'A' }, { id: '2', name: 'B' }];
        vi.mocked(mockMemberRepo.findAll).mockResolvedValueOnce({ data: mockMembers, total: 2 } as any);

        const result = await useCase.execute();
        expect(result.data).toEqual(mockMembers);
        expect(result.pagination).toEqual({ page: 1, page_size: 20, total: 2, total_pages: 1 });
        expect(mockMemberRepo.findAll).toHaveBeenCalledOnce();
    });
});
