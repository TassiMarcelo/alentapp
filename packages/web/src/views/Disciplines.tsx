import {
  Table, Button, Heading, HStack, Stack, Text, Box,
  Flex, Spinner, Center, Input, Badge, IconButton,
} from '@chakra-ui/react';
import { LuPlus, LuPencil, LuTrash2 } from 'react-icons/lu';
import { useEffect, useState } from 'react';
import { disciplinesService } from '../services/disciplines';
import { membersService } from '../services/members';
import type { DisciplineDTO, MemberDTO, DisciplineStatus } from '@alentapp/shared';
import {
  DialogRoot, DialogContent, DialogHeader, DialogTitle,
  DialogBody, DialogFooter, DialogActionTrigger, DialogCloseTrigger,
} from '../components/ui/dialog';
import { Field } from '../components/ui/field';
import {
  SelectRoot, SelectTrigger, SelectValueText,
  SelectContent, SelectItem, createListCollection,
} from '../components/ui/select';

type Modal = 'none' | 'create' | 'edit' | 'delete';

type EditForm = {
  reason: string;
  start_date: string;
  end_date: string;
  is_total_suspension: boolean;
};

const toLocalInput = (iso: string) => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const STATUS_OPTIONS: { label: string; value: '' | DisciplineStatus }[] = [
  { label: 'Todos', value: '' },
  { label: 'Vigentes', value: 'active' },
  { label: 'Vencidas', value: 'expired' },
  { label: 'Por iniciar', value: 'upcoming' },
];

export function DisciplinesView() {
  const [disciplines, setDisciplines] = useState<DisciplineDTO[]>([]);
  const [members, setMembers] = useState<MemberDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<Modal>('none');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterMemberId, setFilterMemberId] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'' | DisciplineStatus>('');
  const [createForm, setCreateForm] = useState({
    reason: '',
    start_date: '',
    end_date: '',
    is_total_suspension: false,
    member_id: '',
  });
  const [deletingDiscipline, setDeletingDiscipline] = useState<DisciplineDTO | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editOriginal, setEditOriginal] = useState<EditForm | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    reason: '',
    start_date: '',
    end_date: '',
    is_total_suspension: false,
  });

  const memberCollection = createListCollection({
    items: members.map((m) => ({ label: `${m.name} (DNI: ${m.dni})`, value: m.id })),
  });

  const memberFilterCollection = createListCollection({
    items: [
      { label: 'Todos los socios', value: '' },
      ...members.map((m) => ({ label: `${m.name} (DNI: ${m.dni})`, value: m.id })),
    ],
  });

  const statusFilterCollection = createListCollection({ items: STATUS_OPTIONS });

  const fetchMembers = async () => {
    try {
      const data = await membersService.getAll();
      setMembers(data);
    } catch { /* silencioso */ }
  };

  const fetchDisciplines = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await disciplinesService.list({
        member_id: filterMemberId || undefined,
        status: filterStatus || undefined,
      });
      setDisciplines(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar las sanciones');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await disciplinesService.create({
        reason: createForm.reason,
        start_date: new Date(createForm.start_date).toISOString(),
        end_date: new Date(createForm.end_date).toISOString(),
        is_total_suspension: createForm.is_total_suspension,
        member_id: createForm.member_id,
      });
      await fetchDisciplines();
      setModal('none');
      setCreateForm({ reason: '', start_date: '', end_date: '', is_total_suspension: false, member_id: '' });
    } catch (err: any) {
      alert(err.message || 'Error al registrar la sanción');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEdit = (d: DisciplineDTO) => {
    const initial: EditForm = {
      reason: d.reason,
      start_date: toLocalInput(d.start_date),
      end_date: toLocalInput(d.end_date),
      is_total_suspension: d.is_total_suspension,
    };
    setEditingId(d.id);
    setEditOriginal(initial);
    setEditForm(initial);
    setModal('edit');
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId || !editOriginal) return;

    const diff: Partial<EditForm> & { start_date?: string; end_date?: string } = {};
    if (editForm.reason !== editOriginal.reason) diff.reason = editForm.reason;
    if (editForm.start_date !== editOriginal.start_date) {
      diff.start_date = new Date(editForm.start_date).toISOString();
    }
    if (editForm.end_date !== editOriginal.end_date) {
      diff.end_date = new Date(editForm.end_date).toISOString();
    }
    if (editForm.is_total_suspension !== editOriginal.is_total_suspension) {
      diff.is_total_suspension = editForm.is_total_suspension;
    }

    if (Object.keys(diff).length === 0) {
      setModal('none');
      return;
    }

    setIsSubmitting(true);
    try {
      await disciplinesService.update(editingId, diff);
      await fetchDisciplines();
      setModal('none');
      setEditingId(null);
      setEditOriginal(null);
    } catch (err: any) {
      alert(err.message || 'Error al actualizar la sanción');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDelete = (d: DisciplineDTO) => {
    setDeletingDiscipline(d);
    setModal('delete');
  };

  const handleDelete = async () => {
    if (!deletingDiscipline) return;
    setIsSubmitting(true);
    try {
      await disciplinesService.delete(deletingDiscipline.id);
      await fetchDisciplines();
      setModal('none');
      setDeletingDiscipline(null);
    } catch (err: any) {
      alert(err.message || 'Error al eliminar la sanción');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => { void fetchMembers(); }, []);
  useEffect(() => { void fetchDisciplines(); }, [filterMemberId, filterStatus]);

  const memberName = (id: string) => members.find((m) => m.id === id)?.name ?? id;

  return (
    <>
      {/* Modal Crear */}
      <DialogRoot open={modal === 'create'} onOpenChange={(e) => !e.open && setModal('none')}>
        <DialogContent>
          <form onSubmit={handleCreate}>
            <DialogHeader><DialogTitle>Registrar Sanción Disciplinaria</DialogTitle></DialogHeader>
            <DialogBody>
              <Stack gap="4">
                <Field label="Socio" required>
                  <SelectRoot
                    collection={memberCollection}
                    value={createForm.member_id ? [createForm.member_id] : []}
                    onValueChange={(val) => setCreateForm({ ...createForm, member_id: val.value[0] ?? '' })}
                  >
                    <SelectTrigger>
                      <SelectValueText placeholder="Seleccionar socio" />
                    </SelectTrigger>
                    <SelectContent>
                      {memberCollection.items.map((item) => (
                        <SelectItem key={item.value} item={item}>{item.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </SelectRoot>
                </Field>

                <Field label="Motivo" required>
                  <Input
                    placeholder="Descripción de la falta cometida"
                    value={createForm.reason}
                    onChange={(e) => setCreateForm({ ...createForm, reason: e.target.value })}
                    required
                  />
                </Field>

                <Field label="Fecha de inicio" required>
                  <Input
                    type="datetime-local"
                    value={createForm.start_date}
                    onChange={(e) => setCreateForm({ ...createForm, start_date: e.target.value })}
                    required
                  />
                </Field>

                <Field label="Fecha de fin" required>
                  <Input
                    type="datetime-local"
                    value={createForm.end_date}
                    onChange={(e) => setCreateForm({ ...createForm, end_date: e.target.value })}
                    required
                  />
                </Field>

                <Field label="¿Suspensión total?">
                  <HStack>
                    <input
                      type="checkbox"
                      id="is_total_suspension"
                      checked={createForm.is_total_suspension}
                      onChange={(e) => setCreateForm({ ...createForm, is_total_suspension: e.target.checked })}
                    />
                    <label htmlFor="is_total_suspension">Sí, es suspensión total</label>
                  </HStack>
                </Field>
              </Stack>
            </DialogBody>
            <DialogFooter>
              <DialogActionTrigger asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogActionTrigger>
              <Button type="submit" loading={isSubmitting}>Registrar</Button>
            </DialogFooter>
            <DialogCloseTrigger />
          </form>
        </DialogContent>
      </DialogRoot>

      {/* Modal Editar */}
      <DialogRoot open={modal === 'edit'} onOpenChange={(e) => !e.open && setModal('none')}>
        <DialogContent>
          <form onSubmit={handleEdit}>
            <DialogHeader><DialogTitle>Editar Sanción Disciplinaria</DialogTitle></DialogHeader>
            <DialogBody>
              <Stack gap="4">
                <Field label="Motivo" required>
                  <Input
                    placeholder="Descripción de la falta cometida"
                    value={editForm.reason}
                    onChange={(e) => setEditForm({ ...editForm, reason: e.target.value })}
                    required
                  />
                </Field>

                <Field label="Fecha de inicio" required>
                  <Input
                    type="datetime-local"
                    value={editForm.start_date}
                    onChange={(e) => setEditForm({ ...editForm, start_date: e.target.value })}
                    required
                  />
                </Field>

                <Field label="Fecha de fin" required>
                  <Input
                    type="datetime-local"
                    value={editForm.end_date}
                    onChange={(e) => setEditForm({ ...editForm, end_date: e.target.value })}
                    required
                  />
                </Field>

                <Field label="¿Suspensión total?">
                  <HStack>
                    <input
                      type="checkbox"
                      id="edit_is_total_suspension"
                      checked={editForm.is_total_suspension}
                      onChange={(e) => setEditForm({ ...editForm, is_total_suspension: e.target.checked })}
                    />
                    <label htmlFor="edit_is_total_suspension">Sí, es suspensión total</label>
                  </HStack>
                </Field>
              </Stack>
            </DialogBody>
            <DialogFooter>
              <DialogActionTrigger asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogActionTrigger>
              <Button type="submit" loading={isSubmitting}>Guardar</Button>
            </DialogFooter>
            <DialogCloseTrigger />
          </form>
        </DialogContent>
      </DialogRoot>

      {/* Modal Eliminar */}
      <DialogRoot
        role="alertdialog"
        open={modal === 'delete'}
        onOpenChange={(e) => {
          if (!e.open) {
            setModal('none');
            setDeletingDiscipline(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader><DialogTitle>Eliminar Sanción Disciplinaria</DialogTitle></DialogHeader>
          <DialogBody>
            <Text>
              ¿Confirmás la eliminación de esta sanción
              {deletingDiscipline ? ` de ${memberName(deletingDiscipline.member_id)}` : ''}?
              Esta acción no puede deshacerse desde la interfaz.
            </Text>
          </DialogBody>
          <DialogFooter>
            <DialogActionTrigger asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogActionTrigger>
            <Button colorPalette="red" loading={isSubmitting} onClick={handleDelete}>
              Eliminar
            </Button>
          </DialogFooter>
          <DialogCloseTrigger />
        </DialogContent>
      </DialogRoot>

      {/* Header */}
      <Box px="8" py="6">
        <Flex justify="space-between" align="center" mb="6">
          <Heading size="lg">Sanciones Disciplinarias</Heading>
          <Button onClick={() => setModal('create')}>
            <LuPlus /> Nueva Sanción
          </Button>
        </Flex>

        {/* Filtros */}
        <HStack gap="4" mb="6" align="end">
          <Field label="Filtrar por socio">
            <SelectRoot
              collection={memberFilterCollection}
              value={[filterMemberId]}
              onValueChange={(val) => setFilterMemberId(val.value[0] ?? '')}
            >
              <SelectTrigger>
                <SelectValueText placeholder="Todos los socios" />
              </SelectTrigger>
              <SelectContent>
                {memberFilterCollection.items.map((item) => (
                  <SelectItem key={item.value || 'all'} item={item}>{item.label}</SelectItem>
                ))}
              </SelectContent>
            </SelectRoot>
          </Field>

          <Field label="Estado de vigencia">
            <SelectRoot
              collection={statusFilterCollection}
              value={[filterStatus]}
              onValueChange={(val) => setFilterStatus((val.value[0] ?? '') as '' | DisciplineStatus)}
            >
              <SelectTrigger>
                <SelectValueText placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value || 'all'} item={opt}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </SelectRoot>
          </Field>
        </HStack>

        {isLoading ? (
          <Center py="16"><Spinner size="xl" /></Center>
        ) : error ? (
          <Center py="16"><Text color="red.500">{error}</Text></Center>
        ) : disciplines.length === 0 ? (
          <Center py="16">
            <Stack align="center" gap="2">
              <Text color="gray.500">No hay sanciones que coincidan con los filtros.</Text>
              <Button size="sm" variant="outline" onClick={() => setModal('create')}>
                Registrar nueva sanción
              </Button>
            </Stack>
          </Center>
        ) : (
          <Table.Root variant="outline">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Socio</Table.ColumnHeader>
                <Table.ColumnHeader>Motivo</Table.ColumnHeader>
                <Table.ColumnHeader>Inicio</Table.ColumnHeader>
                <Table.ColumnHeader>Fin</Table.ColumnHeader>
                <Table.ColumnHeader>Tipo</Table.ColumnHeader>
                <Table.ColumnHeader textAlign="end">Acciones</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {disciplines.map((d) => (
                <Table.Row key={d.id}>
                  <Table.Cell>{memberName(d.member_id)}</Table.Cell>
                  <Table.Cell>{d.reason}</Table.Cell>
                  <Table.Cell>{new Date(d.start_date).toLocaleDateString('es-AR')}</Table.Cell>
                  <Table.Cell>{new Date(d.end_date).toLocaleDateString('es-AR')}</Table.Cell>
                  <Table.Cell>
                    <Badge colorPalette={d.is_total_suspension ? 'red' : 'orange'}>
                      {d.is_total_suspension ? 'Total' : 'Parcial'}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell textAlign="end">
                    <HStack gap="1" justify="end">
                      <IconButton
                        aria-label="Editar sanción"
                        size="sm"
                        variant="ghost"
                        onClick={() => openEdit(d)}
                      >
                        <LuPencil />
                      </IconButton>
                      <IconButton
                        aria-label="Eliminar sanción"
                        size="sm"
                        variant="ghost"
                        colorPalette="red"
                        onClick={() => openDelete(d)}
                      >
                        <LuTrash2 />
                      </IconButton>
                    </HStack>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        )}
      </Box>
    </>
  );
}
