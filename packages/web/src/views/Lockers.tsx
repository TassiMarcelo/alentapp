import {
  Table, Button, Heading, HStack, Stack, Text, Box,
  Flex, Spinner, Center, Input, Badge,
} from '@chakra-ui/react';
import { LuRefreshCw, LuPlus, LuPencil, LuTrash2 } from 'react-icons/lu';
import { useEffect, useState } from 'react';
import { lockersService } from '../services/lockers';
import { membersService } from '../services/members';
import type { LockerDTO, LockerEstado, LockerUbicacion, MemberDTO } from '@alentapp/shared';
import {
  DialogRoot, DialogContent, DialogHeader, DialogTitle,
  DialogBody, DialogFooter, DialogActionTrigger, DialogCloseTrigger,
} from '../components/ui/dialog';
import { Field } from '../components/ui/field';
import {
  SelectRoot, SelectTrigger, SelectValueText,
  SelectContent, SelectItem, createListCollection,
} from '../components/ui/select';

const ubicacionCreateOptions = createListCollection({
  items: [
    { label: 'Vestuario Masculino', value: 'VESTUARIO_MASCULINO' },
    { label: 'Vestuario Femenino', value: 'VESTUARIO_FEMENINO' },
    { label: 'Niños', value: 'NINOS' },
  ],
});

const estadoFilterOptions = createListCollection({
  items: [
    { label: 'Todos', value: '' },
    { label: 'Disponible', value: 'DISPONIBLE' },
    { label: 'Ocupado', value: 'OCUPADO' },
    { label: 'Mantenimiento', value: 'MANTENIMIENTO' },
  ],
});

const ubicacionFilterOptions = createListCollection({
  items: [
    { label: 'Todas', value: '' },
    { label: 'Vestuario Masculino', value: 'VESTUARIO_MASCULINO' },
    { label: 'Vestuario Femenino', value: 'VESTUARIO_FEMENINO' },
    { label: 'Niños', value: 'NINOS' },
  ],
});

const estadoColor: Record<LockerEstado, string> = {
  DISPONIBLE: 'green', OCUPADO: 'blue', MANTENIMIENTO: 'orange',
};

const ubicacionLabel: Record<LockerUbicacion, string> = {
  VESTUARIO_MASCULINO: 'Vest. Masculino',
  VESTUARIO_FEMENINO: 'Vest. Femenino',
  NINOS: 'Niños',
};

type Modal = 'none' | 'create' | 'assign' | 'edit';

export function LockersView() {
  const [lockers, setLockers] = useState<LockerDTO[]>([]);
  const [members, setMembers] = useState<MemberDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<Modal>('none');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedLocker, setSelectedLocker] = useState<LockerDTO | null>(null);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroUbicacion, setFiltroUbicacion] = useState('');
  const [createForm, setCreateForm] = useState({ numero: '', ubicacion: 'VESTUARIO_MASCULINO' as LockerUbicacion });
  const [assignForm, setAssignForm] = useState({ memberId: '', fechaFinContrato: '' });
  const [editForm, setEditForm] = useState({ numero: '', ubicacion: 'VESTUARIO_MASCULINO' as LockerUbicacion });

  const memberCollection = createListCollection({
    items: members.map((m) => ({ label: `${m.name} (DNI: ${m.dni})`, value: m.id })),
  });

  const fetchLockers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await lockersService.getAll({
        ...(filtroEstado ? { estado: filtroEstado as LockerEstado } : {}),
        ...(filtroUbicacion ? { ubicacion: filtroUbicacion as LockerUbicacion } : {}),
      });
      setLockers(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar los lockers');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const data = await membersService.getAll();
      setMembers(data);
    } catch { /* silencioso */ }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await lockersService.create({ numero: Number(createForm.numero), ubicacion: createForm.ubicacion });
      setModal('none');
      setCreateForm({ numero: '', ubicacion: 'VESTUARIO_MASCULINO' });
      void fetchLockers();
    } catch (err: any) {
      alert(err.message || 'Error al crear el locker');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLocker) return;
    setIsSubmitting(true);
    try {
      await lockersService.updateEstado(selectedLocker.id, {
        estado: 'OCUPADO',
        memberId: assignForm.memberId,
        fechaFinContrato: assignForm.fechaFinContrato,
      });
      setModal('none');
      void fetchLockers();
    } catch (err: any) {
      alert(err.message || 'Error al asignar el locker');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLocker) return;
    setIsSubmitting(true);
    try {
      await lockersService.update(selectedLocker.id, {
        numero: Number(editForm.numero),
        ubicacion: editForm.ubicacion,
      });
      setModal('none');
      void fetchLockers();
    } catch (err: any) {
      alert(err.message || 'Error al actualizar el locker');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLiberar = async (locker: LockerDTO) => {
    if (!window.confirm(`¿Confirmas liberar el locker #${locker.numero}?`)) return;
    try {
      await lockersService.updateEstado(locker.id, { estado: 'DISPONIBLE' });
      void fetchLockers();
    } catch (err: any) {
      alert(err.message || 'Error al liberar el locker');
    }
  };

  const handleMantenimiento = async (locker: LockerDTO) => {
    if (!window.confirm(`¿Confirmas enviar el locker #${locker.numero} a mantenimiento?`)) return;
    try {
      await lockersService.updateEstado(locker.id, { estado: 'MANTENIMIENTO' });
      void fetchLockers();
    } catch (err: any) {
      alert(err.message || 'Error al enviar a mantenimiento');
    }
  };

  const handleDelete = async (locker: LockerDTO) => {
    if (!window.confirm(`¿Eliminar el locker #${locker.numero}? Esta acción no se puede deshacer.`)) return;
    try {
      await lockersService.delete(locker.id);
      void fetchLockers();
    } catch (err: any) {
      alert(err.message || 'Error al eliminar el locker');
    }
};

  useEffect(() => { void fetchLockers(); }, [filtroEstado, filtroUbicacion]);
  useEffect(() => { void fetchMembers(); }, []);

  return (
    <>
      {/* Modal Crear */}
      <DialogRoot open={modal === 'create'} onOpenChange={(e) => !e.open && setModal('none')}>
        <DialogContent>
          <form onSubmit={handleCreate}>
            <DialogHeader><DialogTitle>Agregar Nuevo Locker</DialogTitle></DialogHeader>
            <DialogBody>
              <Stack gap="4">
                <Field label="Número" required>
                  <Input type="number" min={1} placeholder="Ej. 1"
                    value={createForm.numero}
                    onChange={(e) => setCreateForm({ ...createForm, numero: e.target.value })}
                    required
                  />
                </Field>
                <Field label="Ubicación" required>
                  <SelectRoot collection={ubicacionCreateOptions} value={[createForm.ubicacion]}
                    onValueChange={(e) => setCreateForm({ ...createForm, ubicacion: e.value[0] as LockerUbicacion })}>
                    <SelectTrigger><SelectValueText /></SelectTrigger>
                    <SelectContent>
                      {ubicacionCreateOptions.items.map((opt) => <SelectItem item={opt} key={opt.value}>{opt.label}</SelectItem>)}
                    </SelectContent>
                  </SelectRoot>
                </Field>
              </Stack>
            </DialogBody>
            <DialogFooter>
              <DialogActionTrigger asChild><Button variant="outline">Cancelar</Button></DialogActionTrigger>
              <Button type="submit" colorPalette="blue" loading={isSubmitting}>Crear</Button>
            </DialogFooter>
            <DialogCloseTrigger />
          </form>
        </DialogContent>
      </DialogRoot>

      {/* Modal Asignar */}
      <DialogRoot open={modal === 'assign'} onOpenChange={(e) => !e.open && setModal('none')}>
        <DialogContent>
          <form onSubmit={handleAssign}>
            <DialogHeader><DialogTitle>Asignar Locker #{selectedLocker?.numero}</DialogTitle></DialogHeader>
            <DialogBody>
              <Stack gap="4">
                <Field label="Socio" required>
                  <SelectRoot collection={memberCollection}
                    value={assignForm.memberId ? [assignForm.memberId] : []}
                    onValueChange={(e) => setAssignForm({ ...assignForm, memberId: e.value[0] })}>
                    <SelectTrigger><SelectValueText placeholder="Seleccione un socio" /></SelectTrigger>
                    <SelectContent>
                      {memberCollection.items.map((m) => <SelectItem item={m} key={m.value}>{m.label}</SelectItem>)}
                    </SelectContent>
                  </SelectRoot>
                </Field>
                <Field label="Fecha de fin de contrato" required>
                  <Input type="date" value={assignForm.fechaFinContrato}
                    onChange={(e) => setAssignForm({ ...assignForm, fechaFinContrato: e.target.value })}
                    required
                  />
                </Field>
              </Stack>
            </DialogBody>
            <DialogFooter>
              <DialogActionTrigger asChild><Button variant="outline">Cancelar</Button></DialogActionTrigger>
              <Button type="submit" colorPalette="blue" loading={isSubmitting}>Asignar</Button>
            </DialogFooter>
            <DialogCloseTrigger />
          </form>
        </DialogContent>
      </DialogRoot>

      {/* Modal Editar */}
      <DialogRoot open={modal === 'edit'} onOpenChange={(e) => !e.open && setModal('none')}>
        <DialogContent>
          <form onSubmit={handleEdit}>
            <DialogHeader><DialogTitle>Editar Locker #{selectedLocker?.numero}</DialogTitle></DialogHeader>
            <DialogBody>
              <Stack gap="4">
                <Field label="Número" required>
                  <Input type="number" min={1}
                    value={editForm.numero}
                    onChange={(e) => setEditForm({ ...editForm, numero: e.target.value })}
                    required
                  />
                </Field>
                <Field label="Ubicación" required>
                  <SelectRoot collection={ubicacionCreateOptions} value={[editForm.ubicacion]}
                    onValueChange={(e) => setEditForm({ ...editForm, ubicacion: e.value[0] as LockerUbicacion })}>
                    <SelectTrigger><SelectValueText /></SelectTrigger>
                    <SelectContent>
                      {ubicacionCreateOptions.items.map((opt) => <SelectItem item={opt} key={opt.value}>{opt.label}</SelectItem>)}
                    </SelectContent>
                  </SelectRoot>
                </Field>
              </Stack>
            </DialogBody>
            <DialogFooter>
              <DialogActionTrigger asChild><Button variant="outline">Cancelar</Button></DialogActionTrigger>
              <Button type="submit" colorPalette="blue" loading={isSubmitting}>Guardar</Button>
            </DialogFooter>
            <DialogCloseTrigger />
          </form>
        </DialogContent>
      </DialogRoot>

      <Stack gap="8">
        <Flex justify="space-between" align="center">
          <Stack gap="1">
            <Heading size="2xl" fontWeight="bold">Administración de Lockers</Heading>
            <Text color="fg.muted" fontSize="md">Gestioná los lockers del club.</Text>
          </Stack>
          <HStack gap="3">
            <Button variant="outline" onClick={fetchLockers} disabled={isLoading}><LuRefreshCw /> Actualizar</Button>
            <Button colorPalette="blue" onClick={() => { setCreateForm({ numero: '', ubicacion: 'VESTUARIO_MASCULINO' }); setModal('create'); }}>
              <LuPlus /> Agregar Locker
            </Button>
          </HStack>
        </Flex>

        {/* Filtros */}
        <HStack gap="4">
          <Box minW="200px">
            <SelectRoot collection={estadoFilterOptions} value={[filtroEstado]} onValueChange={(e) => setFiltroEstado(e.value[0])}>
              <SelectTrigger><SelectValueText placeholder="Filtrar por estado" /></SelectTrigger>
              <SelectContent>
                {estadoFilterOptions.items.map((opt) => <SelectItem item={opt} key={opt.value}>{opt.label}</SelectItem>)}
              </SelectContent>
            </SelectRoot>
          </Box>
          <Box minW="220px">
            <SelectRoot collection={ubicacionFilterOptions} value={[filtroUbicacion]} onValueChange={(e) => setFiltroUbicacion(e.value[0])}>
              <SelectTrigger><SelectValueText placeholder="Filtrar por ubicación" /></SelectTrigger>
              <SelectContent>
                {ubicacionFilterOptions.items.map((opt) => <SelectItem item={opt} key={opt.value}>{opt.label}</SelectItem>)}
              </SelectContent>
            </SelectRoot>
          </Box>
        </HStack>

        {error && (
          <Box p="4" bg="red.50" color="red.700" borderRadius="md" border="1px solid" borderColor="red.200">
            <Text fontWeight="bold">Error:</Text><Text>{error}</Text>
          </Box>
        )}

        <Box bg="bg.panel" borderRadius="xl" boxShadow="sm" borderWidth="1px" overflow="hidden" minH="300px">
          {isLoading ? (
            <Center h="300px"><Stack align="center" gap="4"><Spinner size="xl" color="blue.500" /><Text color="fg.muted">Cargando lockers...</Text></Stack></Center>
          ) : lockers.length === 0 ? (
            <Center h="300px"><Stack align="center" gap="4"><Text color="fg.muted">No se encontraron lockers.</Text><Button variant="ghost" onClick={fetchLockers}>Reintentar</Button></Stack></Center>
          ) : (
            <Table.Root size="md" variant="line" interactive>
              <Table.Header>
                <Table.Row bg="bg.muted/50">
                  <Table.ColumnHeader py="4">Número</Table.ColumnHeader>
                  <Table.ColumnHeader py="4">Ubicación</Table.ColumnHeader>
                  <Table.ColumnHeader py="4">Estado</Table.ColumnHeader>
                  <Table.ColumnHeader py="4">Socio</Table.ColumnHeader>
                  <Table.ColumnHeader py="4">DNI</Table.ColumnHeader>
                  <Table.ColumnHeader py="4">Fin Contrato</Table.ColumnHeader>
                  <Table.ColumnHeader py="4" textAlign="end">Acciones</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {lockers.map((locker) => (
                  <Table.Row key={locker.id} _hover={{ bg: 'bg.muted/30' }}>
                    <Table.Cell fontWeight="semibold">#{locker.numero}</Table.Cell>
                    <Table.Cell color="fg.muted">{ubicacionLabel[locker.ubicacion]}</Table.Cell>
                    <Table.Cell>
                      <Badge colorPalette={estadoColor[locker.estado]}>{locker.estado}</Badge>
                    </Table.Cell>
                    <Table.Cell color="fg.muted">{locker.socio?.nombre ?? '—'}</Table.Cell>
                    <Table.Cell color="fg.muted">{locker.socio?.dni ?? '—'}</Table.Cell>
                    <Table.Cell color="fg.muted">{locker.fechaFinContrato ?? '—'}</Table.Cell>
                    <Table.Cell textAlign="end">
                      <HStack gap="2" justify="flex-end">
                        {locker.estado !== 'OCUPADO' && (
                          <>
                            <Button size="sm" variant="ghost"
                              onClick={() => { setSelectedLocker(locker); setEditForm({ numero: String(locker.numero), ubicacion: locker.ubicacion }); setModal('edit'); }}>
                              <LuPencil />
                            </Button>
                            <Button size="sm" colorPalette="red" variant="ghost"
                              onClick={() => handleDelete(locker)}>
                              <LuTrash2 />
                            </Button>
                          </>
                        )}
                        {locker.estado === 'DISPONIBLE' && (
                          <>
                            <Button size="sm" colorPalette="blue" variant="outline"
                              onClick={() => { setSelectedLocker(locker); setAssignForm({ memberId: '', fechaFinContrato: '' }); setModal('assign'); }}>
                              Asignar
                            </Button>
                            <Button size="sm" colorPalette="orange" variant="outline"
                              onClick={() => handleMantenimiento(locker)}>
                              Mantenimiento
                            </Button>
                          </>
                        )}
                        {locker.estado === 'OCUPADO' && (
                          <Button size="sm" colorPalette="red" variant="outline"
                            onClick={() => handleLiberar(locker)}>
                            Liberar
                          </Button>
                        )}
                        {locker.estado === 'MANTENIMIENTO' && (
                          <Button size="sm" colorPalette="green" variant="outline"
                            onClick={() => lockersService.updateEstado(locker.id, { estado: 'DISPONIBLE' }).then(() => void fetchLockers())}>
                            Disponible
                          </Button>
                        )}
                      </HStack>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          )}
        </Box>
      </Stack>
    </>
  );
}