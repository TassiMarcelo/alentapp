import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Center,
  Flex,
  Heading,
  HStack,
  Input,
  Stack,
  Table,
  Text,
  Spinner,
} from '@chakra-ui/react';
import { LuPlus, LuRefreshCw } from 'react-icons/lu';
import type { MedicalCertificateDTO, MemberDTO } from '@alentapp/shared';
import { membersService } from '../services/members';
import { medicalCertificatesService } from '../services/medicalcertificates';
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

type Modal = 'none' | 'create';

export function MedicalCertificatesView() {
  const [certificates, setCertificates] = useState<MedicalCertificateDTO[]>([]);
  const [members, setMembers] = useState<MemberDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<Modal>('none');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createForm, setCreateForm] = useState({
    member_id: '',
    issue_date: '',
    expiry_date: '',
    doctor_license: '',
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

  const fetchCertificates = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await medicalCertificatesService.getAll();
      setCertificates(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar los certificados médicos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await medicalCertificatesService.create({
        memberId: createForm.member_id,
        issueDate: createForm.issue_date,
        expiryDate: createForm.expiry_date,
        doctorLicense: createForm.doctor_license,
      });
      setModal('none');
      setCreateForm({ member_id: '', issue_date: '', expiry_date: '', doctor_license: '' });
      void fetchCertificates();
    } catch (err: any) {
      alert(err.message || 'Error al registrar el certificado médico');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    void fetchMembers();
    void fetchCertificates();
  }, []);

  const memberName = (id: string) => members.find((m) => m.id === id)?.name ?? '—';

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR');
  };

  const isExpired = (expiryDate: string) => {
    return new Date(expiryDate) < new Date();
  };

  return (
    <>
      {/* Modal Crear */}
      <DialogRoot open={modal === 'create'} onOpenChange={(e) => !e.open && setModal('none')}>
        <DialogContent>
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>Registrar Certificado Médico</DialogTitle>
            </DialogHeader>
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
                        <SelectItem key={item.value} item={item} />
                      ))}
                    </SelectContent>
                  </SelectRoot>
                </Field>

                <Field label="Fecha de Emisión" required>
                  <Input
                    type="date"
                    value={createForm.issue_date}
                    onChange={(e) => setCreateForm({ ...createForm, issue_date: e.target.value })}
                    required
                  />
                </Field>

                <Field label="Fecha de Vencimiento" required>
                  <Input
                    type="date"
                    value={createForm.expiry_date}
                    onChange={(e) => setCreateForm({ ...createForm, expiry_date: e.target.value })}
                    required
                  />
                </Field>

                <Field label="Matrícula del Médico" required>
                  <Input
                    placeholder="Ej. MP12345"
                    value={createForm.doctor_license}
                    onChange={(e) => setCreateForm({ ...createForm, doctor_license: e.target.value })}
                    required
                  />
                </Field>
              </Stack>
            </DialogBody>
            <DialogFooter>
              <DialogActionTrigger asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogActionTrigger>
              <Button type="submit" loading={isSubmitting}>
                Registrar
              </Button>
            </DialogFooter>
            <DialogCloseTrigger />
          </form>
        </DialogContent>
      </DialogRoot>

      {/* Header */}
      <Stack gap="8">
        <Flex justify="space-between" align="center">
          <Stack gap="1">
            <Heading size="2xl" fontWeight="bold">Certificados Médicos</Heading>
            <Text color="fg.muted" fontSize="md">Gestioná los certificados médicos del club.</Text>
          </Stack>
          <HStack gap="3">
            <Button variant="outline" onClick={fetchCertificates} disabled={isLoading}><LuRefreshCw /> Actualizar</Button>
            <Button colorPalette="blue" onClick={() => setModal('create')}>
              <LuPlus /> Nuevo Certificado
            </Button>
          </HStack>
        </Flex>

        {error && (
          <Box p="4" bg="red.50" color="red.700" borderRadius="md" border="1px solid" borderColor="red.200">
            <Text fontWeight="bold">Error:</Text><Text>{error}</Text>
          </Box>
        )}

        <Box bg="bg.panel" borderRadius="xl" boxShadow="sm" borderWidth="1px" overflow="hidden" minH="300px">
          {isLoading ? (
            <Center h="300px"><Stack align="center" gap="4"><Spinner size="xl" color="blue.500" /><Text color="fg.muted">Cargando certificados...</Text></Stack></Center>
          ) : certificates.length === 0 ? (
            <Center h="300px">
              <Stack align="center" gap="4">
                <Text color="fg.muted">No hay certificados médicos registrados.</Text>
                <Button size="sm" colorPalette="blue" onClick={() => setModal('create')}>
                  Registrar primer certificado
                </Button>
              </Stack>
            </Center>
        ) : (
          <Table.Root size="md" variant="line" interactive>
            <Table.Header>
              <Table.Row bg="bg.muted/50">
                <Table.ColumnHeader py="4">Socio</Table.ColumnHeader>
                <Table.ColumnHeader py="4">Emisión</Table.ColumnHeader>
                <Table.ColumnHeader py="4">Vencimiento</Table.ColumnHeader>
                <Table.ColumnHeader py="4">Matrícula Médico</Table.ColumnHeader>
                <Table.ColumnHeader py="4">Estado</Table.ColumnHeader>
                <Table.ColumnHeader py="4">Validado</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {certificates.map((c) => (
                <Table.Row key={c.id} _hover={{ bg: 'bg.muted/30' }}>
                  <Table.Cell color="fg.muted">{memberName(c.member_id)}</Table.Cell>
                  <Table.Cell color="fg.muted">{formatDate(c.issue_date)}</Table.Cell>
                  <Table.Cell color="fg.muted">{formatDate(c.expiry_date)}</Table.Cell>
                  <Table.Cell color="fg.muted">{c.doctor_license}</Table.Cell>
                  <Table.Cell>
                    <Text
                      color={isExpired(c.expiry_date) ? 'red.600' : 'green.600'}
                      fontWeight="bold"
                    >
                      {isExpired(c.expiry_date) ? 'Vencido' : 'Vigente'}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>{c.is_validated ? '✓' : '✗'}</Table.Cell>
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
