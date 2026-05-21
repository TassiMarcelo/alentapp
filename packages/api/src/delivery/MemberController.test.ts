import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemberController } from './MemberController.js';

describe('MemberController', () => {
    // 1. Mocks de los Casos de Uso
    const mockCreateUseCase = { execute: vi.fn() };
    const mockGetUseCase = { execute: vi.fn() };
    const mockUpdateUseCase = { execute: vi.fn() };
    const mockDeleteUseCase = { execute: vi.fn() };

    const controller = new MemberController(
        mockCreateUseCase as any,
        mockGetUseCase as any,
        mockUpdateUseCase as any,
        mockDeleteUseCase as any
    );

    // 2. Mocks de Fastify Request y Reply
    const mockReply = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn()
    };

    const mockRequest = {
        log: { info: vi.fn() },
        body: { name: 'Juan' },
        params: { id: '123' },
        query: {}
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('create', () => {
        it('debe devolver status 201 y los datos si la creación es exitosa', async () => {
            const mockSocio = { id: '1', name: 'Juan' };
            mockCreateUseCase.execute.mockResolvedValueOnce(mockSocio);
            
            await controller.create(mockRequest as any, mockReply as any);
            
            expect(mockReply.status).toHaveBeenCalledWith(201);
            expect(mockReply.send).toHaveBeenCalledWith({ data: mockSocio });
        });

        it('debe devolver status 409 Conflict si el DNI ya existe', async () => {
            mockCreateUseCase.execute.mockRejectedValueOnce(new Error('Ya existe un miembro con ese DNI'));
            
            await controller.create(mockRequest as any, mockReply as any);
            
            expect(mockReply.status).toHaveBeenCalledWith(409);
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'Ya existe un miembro con ese DNI' });
        });

        it('debe devolver status 400 Bad Request si el email es inválido', async () => {
            mockCreateUseCase.execute.mockRejectedValueOnce(new Error('Formato de correo electrónico inválido'));
            
            await controller.create(mockRequest as any, mockReply as any);
            
            expect(mockReply.status).toHaveBeenCalledWith(400);
        });

        it('debe devolver status 500 para cualquier otro error (ej. error de DB)', async () => {
            mockCreateUseCase.execute.mockRejectedValueOnce(new Error('Error de conexion de Prisma...'));
            
            await controller.create(mockRequest as any, mockReply as any);
            
            expect(mockReply.status).toHaveBeenCalledWith(500);
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'Error interno, reintente más tarde' });
        });
    });

    describe('delete', () => {
        it('debe devolver status 204 si la eliminación es exitosa', async () => {
            mockDeleteUseCase.execute.mockResolvedValueOnce(undefined);
            
            await controller.delete(mockRequest as any, mockReply as any);
            
            expect(mockReply.status).toHaveBeenCalledWith(204);
            expect(mockReply.send).toHaveBeenCalledWith();
        });

        it('debe devolver status 400 si el caso de uso lanza error (ej. miembro no existe)', async () => {
            mockDeleteUseCase.execute.mockRejectedValueOnce(new Error('El miembro no existe'));
            
            await controller.delete(mockRequest as any, mockReply as any);
            
            expect(mockReply.status).toHaveBeenCalledWith(400);
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'El miembro no existe' });
        });
    });

    describe('getAll', () => {
        it('debe devolver status 200 y la lista paginada de socios', async () => {
            const mockResult = {
                data: [{ id: '1', name: 'A' }, { id: '2', name: 'B' }],
                pagination: { page: 1, page_size: 20, total: 2, total_pages: 1 },
            };
            mockGetUseCase.execute.mockResolvedValueOnce(mockResult);

            await controller.getAll(mockRequest as any, mockReply as any);

            expect(mockReply.status).toHaveBeenCalledWith(200);
            expect(mockReply.send).toHaveBeenCalledWith(mockResult);
        });

        it('debe devolver status 500 si falla el caso de uso', async () => {
            mockGetUseCase.execute.mockRejectedValueOnce(new Error('DB Falló'));
            
            await controller.getAll(mockRequest as any, mockReply as any);
            
            expect(mockReply.status).toHaveBeenCalledWith(500);
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'DB Falló' });
        });
    });

    describe('update', () => {
        it('debe devolver status 200 y los datos si se actualiza correctamente', async () => {
            const mockSocio = { id: '123', name: 'Nuevo Juan' };
            mockUpdateUseCase.execute.mockResolvedValueOnce(mockSocio);
            
            await controller.update(mockRequest as any, mockReply as any);
            
            expect(mockUpdateUseCase.execute).toHaveBeenCalledWith('123', { name: 'Juan' });
            expect(mockReply.status).toHaveBeenCalledWith(200);
            expect(mockReply.send).toHaveBeenCalledWith({ data: mockSocio });
        });

        it('debe devolver status 409 Conflict si el nuevo DNI ya existe', async () => {
            mockUpdateUseCase.execute.mockRejectedValueOnce(new Error('Ya existe un miembro con ese DNI'));
            
            await controller.update(mockRequest as any, mockReply as any);
            
            expect(mockReply.status).toHaveBeenCalledWith(409);
        });

        it('debe devolver status 400 si el miembro no existe o el email es inválido', async () => {
            mockUpdateUseCase.execute.mockRejectedValueOnce(new Error('El miembro no existe'));
            
            await controller.update(mockRequest as any, mockReply as any);
            
            expect(mockReply.status).toHaveBeenCalledWith(400);
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'El miembro no existe' });
        });

        it('debe devolver status 500 ante un error genérico', async () => {
            mockUpdateUseCase.execute.mockRejectedValueOnce(new Error('Generic failure'));
            
            await controller.update(mockRequest as any, mockReply as any);
            
            expect(mockReply.status).toHaveBeenCalledWith(500);
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'Error interno, reintente más tarde' });
        });
    });
});
