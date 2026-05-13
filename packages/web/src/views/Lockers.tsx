import {
  Table,
  Button,
  Heading,
  HStack,
  Stack,
  Text,
  Box,
  Flex,
  Spinner,
  Center,
  Input,
  Badge,
} from '@chakra-ui/react';
import { LuRefreshCw, LuPlus } from 'react-icons/lu';
import { useEffect, useState } from 'react';
import { lockersService } from '../services/lockers';
import type { LockerDTO, LockerEstado, LockerUbicacion } from '@alentapp/shared';
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
  DialogActionTrigger,
  DialogCloseTrigger,
} from '../components/ui/dialog';
import { Field } from '../components/ui/field';
import {
  SelectRoot,
  SelectTrigger,
  SelectValueText,
  SelectContent,
  SelectItem,
  createListCollection,
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
  DISPONIBLE: 'green',
  OCUPADO: 'blue',
  MANTENIMIENTO: 'orange',
};

const ubicacionLabel: Record<LockerUbicacion, string> = {
  VESTUARIO_MASCULINO: 'Vest. Masculino',
  VESTUARIO_FEMENINO: 'Vest. Femenino',
  NINOS: 'Niños',
};

export function LockersView() {
  const [lockers, setLockers] = useState<LockerDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroUbicacion, setFiltroUbicacion] = useState('');
  const [formData, setFormData] = useState({
    numero: '',
    ubicacion: 'VESTUARIO_MASCULINO' as LockerUbicacion,
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await lockersService.create({
        numero: Number(formData.numero),
        ubicacion: formData.ubicacion,
      });
      setIsDialogOpen(false);
      setFormData({ numero: '', ubicacion: 'VESTUARIO_MASCULINO' });
      fetchLockers();
    } catch (err: any) {
      alert(err.message || 'Error al crear el locker');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => { fetchLockers(); }, [filtroEstado, filtroUbicacion]);

  return (
    <DialogRoot open={isDialogOpen} onOpenChange={(e) => setIsDialogOpen(e.open)}>
      <Stack gap="8">
        <Flex justify="space-between" align="center">
          <Stack gap="1">
            <Heading size="2xl" fontWeight="bold">Administración de Lockers</Heading>
            <Text color="fg.muted" fontSize="md">Gestioná los lockers del club.</Text>
          </Stack>
          <HStack gap="3">
            <Button variant="outline" onClick={fetchLockers} disabled={isLoading}>
              <LuRefreshCw /> Actualizar
            </Button>
            <Button colorPalette="blue" onClick={() => setIsDialogOpen(true)}>
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

        {/* Modal Crear */}
        <DialogContent>
          <form onSubmit={handleCreate}>
            <DialogHeader><DialogTitle>Agregar Nuevo Locker</DialogTitle></DialogHeader>
            <DialogBody>
              <Stack gap="4">
                <Field label="Número" required>
                  <Input type="number" min={1} placeholder="Ej. 1"
                    value={formData.numero}
                    onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                    required
                  />
                </Field>
                <Field label="Ubicación" required>
                  <SelectRoot collection={ubicacionCreateOptions} value={[formData.ubicacion]}
                    onValueChange={(e) => setFormData({ ...formData, ubicacion: e.value[0] as LockerUbicacion })}>
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
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          )}
        </Box>
      </Stack>
    </DialogRoot>
  );
}