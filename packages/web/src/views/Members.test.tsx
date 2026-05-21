import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MembersView } from './Members';
import { membersService } from '../services/members';
import { Provider } from '../components/ui/provider';

import type { MemberDTO } from '@alentapp/shared';

// Mockeamos el servicio que hace el fetch real para aislar el componente
vi.mock('../services/members', () => ({
  membersService: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  }
}));

describe('MembersView', () => {
  const renderWithProviders = (ui: React.ReactElement) => {
    return render(<Provider>{ui}</Provider>);
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe mostrar el estado de carga y luego renderizar una tabla vacía', async () => {
    // Simulamos que el backend no tiene socios
    vi.mocked(membersService.getAll).mockResolvedValueOnce({ data: [], pagination: { page: 1, page_size: 20, total: 0, total_pages: 0 } });

    renderWithProviders(<MembersView />);

    // Chakra UI Spinner suele tener un texto oculto u ocupamos verificar el texto manual
    expect(screen.getByText('Cargando miembros...')).toBeInTheDocument();

    // Esperamos a que la promesa se resuelva
    await waitFor(() => {
      expect(screen.queryByText('Cargando miembros...')).not.toBeInTheDocument();
    });
    
    // Verificamos que se renderice la interfaz pero indicando que no hay datos
    expect(screen.getByText('No se encontraron miembros.')).toBeInTheDocument();
  });

  it('debe renderizar la lista de socios si el backend responde exitosamente', async () => {
    const mockMembers = [
      { id: '1', name: 'Juan Perez', dni: '12345678', email: 'juan@test.com', birthdate: '1990-01-01', category: 'Pleno', status: 'Activo', created_at: new Date().toISOString() },
      { id: '2', name: 'Maria Cadete', dni: '87654321', email: 'maria@test.com', birthdate: '2015-01-01', category: 'Cadete', status: 'Moroso', created_at: new Date().toISOString() }
    ] as MemberDTO[];
    vi.mocked(membersService.getAll).mockResolvedValueOnce({ data: mockMembers, pagination: { page: 1, page_size: 20, total: 2, total_pages: 1 } });

    renderWithProviders(<MembersView />);

    // Esperamos a que los datos se inyecten en el DOM
    await waitFor(() => {
      expect(screen.getByText('Juan Perez')).toBeInTheDocument();
    });

    // Validamos el primer socio
    expect(screen.getByText('12345678')).toBeInTheDocument();
    expect(screen.getByText('juan@test.com')).toBeInTheDocument();

    // Validamos el segundo socio
    expect(screen.getByText('Maria Cadete')).toBeInTheDocument();
    expect(screen.getByText('Moroso')).toBeInTheDocument();
  });

  it('debe renderizar un mensaje de error si el servicio backend falla', async () => {
    // Simulamos un error 500
    vi.mocked(membersService.getAll).mockRejectedValueOnce(new Error('Servidor caído'));

    renderWithProviders(<MembersView />);

    // Esperamos a que se muestre el texto de error rojo en pantalla
    await waitFor(() => {
      expect(screen.getByText('Servidor caído')).toBeInTheDocument();
    });
  });

  it('debe permitir crear un nuevo miembro mediante el formulario', async () => {
    const user = (await import('@testing-library/user-event')).default.setup();
    
    // Configuramos el mock para que devuelva algo en todas las llamadas, no solo en la primera
    vi.mocked(membersService.getAll).mockResolvedValue({ data: [], pagination: { page: 1, page_size: 20, total: 0, total_pages: 0 } });
    vi.mocked(membersService.create).mockResolvedValueOnce({
      id: '3', name: 'Nuevo Socio', dni: '11111111', email: 'nuevo@test.com', birthdate: '2000-01-01', category: 'Pleno', status: 'Activo', created_at: new Date().toISOString()
    });

    renderWithProviders(<MembersView />);

    // Esperamos que termine de cargar
    await waitFor(() => {
      expect(screen.queryByText('Cargando miembros...')).not.toBeInTheDocument();
    });

    // Hacemos click en "Agregar Miembro"
    const addButton = screen.getByText(/Agregar Miembro/i);
    await user.click(addButton);

    // Llenamos el formulario
    await user.type(screen.getByPlaceholderText('Ej. Juan Pérez'), 'Nuevo Socio');
    await user.type(screen.getByPlaceholderText('Ej. 12345678'), '11111111');
    await user.type(screen.getByPlaceholderText('ejemplo@correo.com'), 'nuevo@test.com');
    
    const dateInput = screen.getByLabelText(/Fecha de Nacimiento/i);
    (await import('@testing-library/react')).fireEvent.change(dateInput, { target: { value: '2000-01-01' } });

    // Clic en submit
    const submitButton = screen.getByText('Crear Miembro');
    await user.click(submitButton);

    // Verificamos que el servicio create fue llamado
    expect(membersService.create).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Nuevo Socio',
      dni: '11111111',
      email: 'nuevo@test.com'
    }));
  });

  it('debe permitir eliminar un miembro con confirmación', async () => {
    const user = (await import('@testing-library/user-event')).default.setup();
    
    const mockMembers = [
      { id: '1', name: 'Juan Perez', dni: '12345678', email: 'juan@test.com', birthdate: '1990-01-01', category: 'Pleno', status: 'Activo', created_at: new Date().toISOString() }
    ] as MemberDTO[];
    
    vi.mocked(membersService.getAll).mockResolvedValue({ data: mockMembers, pagination: { page: 1, page_size: 20, total: mockMembers.length, total_pages: 1 } });
    vi.mocked(membersService.delete).mockResolvedValueOnce(undefined);

    // Interceptamos la alerta del navegador
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderWithProviders(<MembersView />);

    await waitFor(() => {
      expect(screen.getByText('Juan Perez')).toBeInTheDocument();
    });

    // Clic en eliminar
    const deleteButton = screen.getByLabelText(/Eliminar miembro/i);
    await user.click(deleteButton);

    expect(confirmSpy).toHaveBeenCalledWith('¿Estás seguro de que deseas eliminar al miembro "Juan Perez"? Esta acción no se puede deshacer.');
    expect(membersService.delete).toHaveBeenCalledWith('1');
    
    confirmSpy.mockRestore();
  });

  it('debe permitir editar un miembro existente', async () => {
    const user = (await import('@testing-library/user-event')).default.setup();
    
    const mockMembers = [
      { id: '1', name: 'Juan Perez', dni: '12345678', email: 'juan@test.com', birthdate: '1990-01-01', category: 'Pleno', status: 'Activo', created_at: new Date().toISOString() }
    ] as MemberDTO[];
    
    vi.mocked(membersService.getAll).mockResolvedValue({ data: mockMembers, pagination: { page: 1, page_size: 20, total: mockMembers.length, total_pages: 1 } });
    vi.mocked(membersService.update).mockResolvedValueOnce({
      ...mockMembers[0],
      name: 'Juan Perez Editado'
    });

    renderWithProviders(<MembersView />);

    await waitFor(() => {
      expect(screen.getByText('Juan Perez')).toBeInTheDocument();
    });

    // Clic en editar
    const editButton = screen.getByLabelText(/Editar miembro/i);
    await user.click(editButton);

    // Modificamos el nombre
    const nameInput = screen.getByPlaceholderText('Ej. Juan Pérez');
    await user.clear(nameInput);
    await user.type(nameInput, 'Juan Perez Editado');

    // Guardar cambios
    const submitButton = screen.getByText('Guardar Cambios');
    await user.click(submitButton);

    expect(membersService.update).toHaveBeenCalledWith('1', expect.objectContaining({
      name: 'Juan Perez Editado'
    }));
  });
});
