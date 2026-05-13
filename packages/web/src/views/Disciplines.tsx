import {
  Table, Button, Heading, HStack, Stack, Text, Box,
  Flex, Spinner, Center, Input, Badge,
} from '@chakra-ui/react';
import { LuPlus } from 'react-icons/lu';
import { useEffect, useState } from 'react';
import { disciplinesService } from '../services/disciplines';
import { membersService } from '../services/members';
import type { DisciplineDTO, MemberDTO } from '@alentapp/shared';
import {
  DialogRoot, DialogContent, DialogHeader, DialogTitle,
  DialogBody, DialogFooter, DialogActionTrigger, DialogCloseTrigger,
} from '../components/ui/dialog';
import { Field } from '../components/ui/field';
import {
  SelectRoot, SelectTrigger, SelectValueText,
  SelectContent, SelectItem, createListCollection,
} from '../components/ui/select';

type Modal = 'none' | 'create';

export function DisciplinesView() {
  const [disciplines, setDisciplines] = useState<DisciplineDTO[]>([]);
  const [members, setMembers] = useState<MemberDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<Modal>('none');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createForm, setCreateForm] = useState({
    reason: '',
    start_date: '',
    end_date: '',
    is_total_suspension: false,
    member_id: '',
  });

  const memberCollection = createListCollection({
    items: members.map((m) => ({ label: `${m.name} (DNI: ${m.dni})`, value: m.id })),
  });

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
      const newDiscipline = await disciplinesService.create({
        reason: createForm.reason,
        start_date: new Date(createForm.start_date).toISOString(),
        end_date: new Date(createForm.end_date).toISOString(),
        is_total_suspension: createForm.is_total_suspension,
        member_id: createForm.member_id,
      });
      setDisciplines((prev) => [newDiscipline, ...prev]);
      setModal('none');
      setCreateForm({ reason: '', start_date: '', end_date: '', is_total_suspension: false, member_id: '' });
    } catch (err: any) {
      alert(err.message || 'Error al registrar la sanción');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => { void fetchMembers(); setIsLoading(false); }, []);

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

      {/* Header */}
      <Box px="8" py="6">
        <Flex justify="space-between" align="center" mb="6">
          <Heading size="lg">Sanciones Disciplinarias</Heading>
          <Button onClick={() => setModal('create')}>
            <LuPlus /> Nueva Sanción
          </Button>
        </Flex>

        {isLoading ? (
          <Center py="16"><Spinner size="xl" /></Center>
        ) : error ? (
          <Center py="16"><Text color="red.500">{error}</Text></Center>
        ) : disciplines.length === 0 ? (
          <Center py="16">
            <Stack align="center" gap="2">
              <Text color="gray.500">No hay sanciones registradas.</Text>
              <Button size="sm" variant="outline" onClick={() => setModal('create')}>
                Registrar primera sanción
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
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        )}
      </Box>
    </>
  );
}
