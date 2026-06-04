import {
  Table, Button, Heading, HStack, Stack, Text, Box,
  Flex, Spinner, Center, Input, Badge,
} from '@chakra-ui/react';
import { LuRefreshCw, LuPlus, LuPencil, LuTrash2, LuUserPlus } from 'react-icons/lu';
import { useEffect, useState } from 'react';
import { sportsService } from '../services/sports';
import { membersService } from '../services/members';
import type { SportDTO, MemberDTO } from '@alentapp/shared';
import {
  DialogRoot, DialogContent, DialogHeader, DialogTitle,
  DialogBody, DialogFooter, DialogActionTrigger, DialogCloseTrigger,
} from '../components/ui/dialog';
import { Field } from '../components/ui/field';
import { notify } from '../components/ui/toaster';
import {
  SelectRoot, SelectTrigger, SelectValueText,
  SelectContent, SelectItem, createListCollection,
} from '../components/ui/select';

type Modal = 'none' | 'create' | 'assign' | 'edit';

export function SportsView() {
  const [sports, setSports] = useState<SportDTO[]>([]);
  const [members, setMembers] = useState<MemberDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<Modal>('none');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSport, setSelectedSport] = useState<SportDTO | null>(null);
  
  const [createForm, setCreateForm] = useState({
    nombre: '',
    descripcion: '',
    cupoMaximo: '',
    precioAdicional: '',
    esFederado: false,
    requires_medical_certificate: false,
  });

  const [editForm, setEditForm] = useState({
    descripcion: '',
    cupoMaximo: '',
  });

  const [assignForm, setAssignForm] = useState({ memberId: '' });

  const memberCollection = createListCollection({
    items: members.map((m) => ({ label: `${m.name} (DNI: ${m.dni})`, value: m.id })),
  });

  const fetchSports = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await sportsService.getAll();
      setSports(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar los deportes');
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
      await sportsService.create({
        nombre: createForm.nombre,
        descripcion: createForm.descripcion,
        cupoMaximo: Number(createForm.cupoMaximo),
        precioAdicional: Number(createForm.precioAdicional || 0),
        esFederado: createForm.esFederado,
        requires_medical_certificate: createForm.requires_medical_certificate,
      });
      setModal('none');
      setCreateForm({
        nombre: '', descripcion: '', cupoMaximo: '', precioAdicional: '', esFederado: false, requires_medical_certificate: false
      });
      void fetchSports();
    } catch (err: any) {
      notify.error(err.message || 'Error al crear el deporte');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSport) return;
    setIsSubmitting(true);
    try {
      await sportsService.update(selectedSport.id, {
        descripcion: editForm.descripcion,
        cupoMaximo: Number(editForm.cupoMaximo),
      });
      setModal('none');
      void fetchSports();
    } catch (err: any) {
      notify.error(err.message || 'Error al actualizar el deporte');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSport) return;
    setIsSubmitting(true);
    try {
      // TODO: Conectar con backend para guardar inscripcion de deporte
      notify.info('Funcionalidad de inscripción en desarrollo.');
      setModal('none');
    } catch (err: any) {
      notify.error(err.message || 'Error al asignar el socio');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (sport: SportDTO) => {
    if (!window.confirm(`¿Eliminar el deporte ${sport.nombre}? Se perderán los vínculos con los socios y la acción no se puede deshacer.`)) return;
    try {
      await sportsService.delete(sport.id);
      void fetchSports();
    } catch (err: any) {
      notify.error(err.message || 'Error al eliminar el deporte');
    }
  };

  useEffect(() => { void fetchSports(); }, []);
  useEffect(() => { void fetchMembers(); }, []);

  return (
    <>
      <Stack gap="6" p="6" maxW="1200px" mx="auto">
        <Flex justify="space-between" align="center" wrap="wrap" gap="4">
          <Box>
            <Heading size="2xl" fontWeight="bold">Administración de Deportes</Heading>
            <Text color="gray.500">Gestioná el catálogo de deportes del club.</Text>
          </Box>
          <HStack>
            <Button variant="outline" onClick={() => fetchSports()}>
              <LuRefreshCw /> Actualizar
            </Button>
            <Button colorPalette="blue" onClick={() => setModal('create')}>
              <LuPlus /> Agregar Deporte
            </Button>
          </HStack>
        </Flex>

        {isLoading ? (
          <Center p="10"><Spinner size="xl" /></Center>
        ) : error ? (
          <Center p="10"><Text color="red.500">{error}</Text></Center>
        ) : (
          <Box borderWidth="1px" borderRadius="lg" overflow="hidden" bg="white" shadow="sm">
            <Table.Root size="md" variant="line">
              <Table.Header>
                <Table.Row bg="gray.50">
                  <Table.ColumnHeader>Nombre</Table.ColumnHeader>
                  <Table.ColumnHeader>Descripción</Table.ColumnHeader>
                  <Table.ColumnHeader>Cupo</Table.ColumnHeader>
                  <Table.ColumnHeader>Precio</Table.ColumnHeader>
                  <Table.ColumnHeader>Requisitos</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="right">Acciones</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {sports.map((sport) => (
                  <Table.Row key={sport.id} _hover={{ bg: 'gray.50' }}>
                    <Table.Cell fontWeight="medium">{sport.nombre}</Table.Cell>
                    <Table.Cell color="gray.600">{sport.descripcion || '—'}</Table.Cell>
                    <Table.Cell>{sport.cupoMaximo}</Table.Cell>
                    <Table.Cell>${sport.precioAdicional}</Table.Cell>
                    <Table.Cell>
                      <Stack gap="1" align="start">
                        {sport.esFederado && <Badge colorPalette="purple" size="sm">Federado</Badge>}
                        {sport.requires_medical_certificate && <Badge colorPalette="red" size="sm">Cert. Médico</Badge>}
                        {!sport.esFederado && !sport.requires_medical_certificate && <Text color="gray.400" fontSize="sm">—</Text>}
                      </Stack>
                    </Table.Cell>
                    <Table.Cell textAlign="right">
                      <HStack gap="2" justify="flex-end">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => {
                            setSelectedSport(sport);
                            setEditForm({
                              descripcion: sport.descripcion || '',
                              cupoMaximo: sport.cupoMaximo.toString(),
                            });
                            setModal('edit');
                          }}
                          title="Editar"
                        >
                          <LuPencil />
                        </Button>
                        <Button size="sm" variant="ghost" colorPalette="red" onClick={() => handleDelete(sport)} title="Eliminar">
                          <LuTrash2 />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          colorPalette="blue"
                          onClick={() => {
                            setSelectedSport(sport);
                            setModal('assign');
                          }}
                        >
                          <LuUserPlus /> Asignar
                        </Button>
                      </HStack>
                    </Table.Cell>
                  </Table.Row>
                ))}
                {sports.length === 0 && (
                  <Table.Row>
                    <Table.Cell colSpan={6} textAlign="center" py="8" color="gray.500">
                      No hay deportes registrados.
                    </Table.Cell>
                  </Table.Row>
                )}
              </Table.Body>
            </Table.Root>
          </Box>
        )}
      </Stack>

      {/* Modal Crear */}
      <DialogRoot open={modal === 'create'} onOpenChange={(e) => !e.open && setModal('none')}>
        <DialogContent>
          <form onSubmit={handleCreate}>
            <DialogHeader><DialogTitle>Agregar Nuevo Deporte</DialogTitle></DialogHeader>
            <DialogBody>
              <Stack gap="4">
                <Field label="Nombre" required>
                  <Input placeholder="Ej. Basquet" value={createForm.nombre} onChange={(e) => setCreateForm({ ...createForm, nombre: e.target.value })} required />
                </Field>
                <Field label="Descripción">
                  <Input placeholder="Breve descripción" value={createForm.descripcion} onChange={(e) => setCreateForm({ ...createForm, descripcion: e.target.value })} />
                </Field>
                <Field label="Cupo Máximo" required>
                  <Input type="number" min={1} placeholder="Ej. 15" value={createForm.cupoMaximo} onChange={(e) => setCreateForm({ ...createForm, cupoMaximo: e.target.value })} required />
                </Field>
                <Field label="Precio Adicional ($)">
                  <Input type="number" step="0.01" min={0} placeholder="Ej. 1200" value={createForm.precioAdicional} onChange={(e) => setCreateForm({ ...createForm, precioAdicional: e.target.value })} />
                </Field>
                <Box display="flex" alignItems="center" gap="2" mt="2">
                  <input type="checkbox" id="esFederado" checked={createForm.esFederado} onChange={(e) => setCreateForm({ ...createForm, esFederado: e.target.checked })} />
                  <label htmlFor="esFederado">Es Federado</label>
                </Box>
                <Box display="flex" alignItems="center" gap="2">
                  <input type="checkbox" id="requiresMedical" checked={createForm.requires_medical_certificate} onChange={(e) => setCreateForm({ ...createForm, requires_medical_certificate: e.target.checked })} />
                  <label htmlFor="requiresMedical">Requiere Certificado Médico</label>
                </Box>
              </Stack>
            </DialogBody>
            <DialogFooter>
              <DialogActionTrigger asChild><Button variant="outline">Cancelar</Button></DialogActionTrigger>
              <Button type="submit" colorPalette="blue" loading={isSubmitting}>Crear</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </DialogRoot>

      {/* Modal Editar */}
      <DialogRoot open={modal === 'edit'} onOpenChange={(e) => !e.open && setModal('none')}>
        <DialogContent>
          <form onSubmit={handleEdit}>
            <DialogHeader><DialogTitle>Editar Deporte: {selectedSport?.nombre}</DialogTitle></DialogHeader>
            <DialogBody>
              <Stack gap="4">
                {/* El nombre es readonly por regla de negocio */}
                <Field label="Nombre">
                  <Input value={selectedSport?.nombre || ''} readOnly bg="gray.100" />
                </Field>
                <Field label="Descripción">
                  <Input placeholder="Breve descripción" value={editForm.descripcion} onChange={(e) => setEditForm({ ...editForm, descripcion: e.target.value })} />
                </Field>
                <Field label="Cupo Máximo" required>
                  <Input type="number" min={1} placeholder="Ej. 15" value={editForm.cupoMaximo} onChange={(e) => setEditForm({ ...editForm, cupoMaximo: e.target.value })} required />
                </Field>
              </Stack>
            </DialogBody>
            <DialogFooter>
              <DialogActionTrigger asChild><Button variant="outline">Cancelar</Button></DialogActionTrigger>
              <Button type="submit" colorPalette="blue" loading={isSubmitting}>Guardar Cambios</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </DialogRoot>

      {/* Modal Asignar */}
      <DialogRoot open={modal === 'assign'} onOpenChange={(e) => !e.open && setModal('none')}>
        <DialogContent>
          <form onSubmit={handleAssign}>
            <DialogHeader><DialogTitle>Asignar Socio a {selectedSport?.nombre}</DialogTitle></DialogHeader>
            <DialogBody>
              <Stack gap="4">
                <Field label="Socio" required>
                  <SelectRoot 
                    collection={memberCollection} 
                    value={assignForm.memberId ? [assignForm.memberId] : []}
                    onValueChange={(details) => setAssignForm({ ...assignForm, memberId: details.value[0] })}
                  >
                    <SelectTrigger>
                      <SelectValueText placeholder="Seleccionar socio" />
                    </SelectTrigger>
                    <SelectContent>
                      {memberCollection.items.map((item) => (
                        <SelectItem key={item.value} item={item}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </SelectRoot>
                </Field>
              </Stack>
            </DialogBody>
            <DialogFooter>
              <DialogActionTrigger asChild><Button variant="outline">Cancelar</Button></DialogActionTrigger>
              <Button type="submit" colorPalette="blue" loading={isSubmitting}>Asignar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </DialogRoot>

    </>
  );
}
