import { 
  Table, 
  Button, 
  Heading, 
  HStack, 
  IconButton, 
  Stack, 
  Text, 
  Box,
  Flex,
  Spinner,
  Center,
  Input
} from "@chakra-ui/react";
import { LuPlus, LuPencil, LuTrash2, LuRefreshCw } from "react-icons/lu";
import { useEffect, useState } from "react";
import { membersService } from "../services/members";
import type { MemberDTO, CreateMemberRequest, UpdateMemberRequest, MemberCategory, MemberStatus, PaginationMeta } from "@alentapp/shared";
import { PaginationControls } from "../components/ui/pagination-controls";

const PAGE_SIZE = 20;
import { 
  DialogRoot, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogBody, 
  DialogFooter, 
  DialogActionTrigger,
  DialogCloseTrigger
} from "../components/ui/dialog";
import { Field } from "../components/ui/field";
import { 
  SelectRoot, 
  SelectTrigger, 
  SelectValueText, 
  SelectContent, 
  SelectItem, 
  createListCollection 
} from "../components/ui/select";

const categories = createListCollection({
  items: [
    { label: "Pleno", value: "Pleno" },
    { label: "Cadete", value: "Cadete" },
    { label: "Honorario", value: "Honorario" },
  ],
});

const statusCategories = createListCollection({
  items: [
    { label: "Activo", value: "Activo" },
    { label: "Moroso", value: "Moroso" },
    { label: "Suspendido", value: "Suspendido" },
  ],
});

export function MembersView() {
  const [members, setMembers] = useState<MemberDTO[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({ page: 1, page_size: PAGE_SIZE, total: 0, total_pages: 0 });
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for the modal
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateMemberRequest & { status?: MemberStatus }>({
    name: "",
    dni: "",
    email: "",
    birthdate: "",
    category: "Pleno",
  });

  const fetchMembers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await membersService.getAll({ page, page_size: PAGE_SIZE });
      setMembers(result.data);
      setPagination(result.pagination);
    } catch (err: any) {
      setError(err.message || "Error al cargar los miembros");
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingMemberId(null);
    setFormData({ name: "", dni: "", email: "", birthdate: "", category: "Pleno" });
    setIsDialogOpen(true);
  };

  const openEditModal = (member: MemberDTO) => {
    setEditingMemberId(member.id);
    setFormData({
      name: member.name,
      dni: member.dni,
      email: member.email,
      birthdate: member.birthdate,
      category: member.category,
      status: member.status,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingMemberId) {
        await membersService.update(editingMemberId, formData as UpdateMemberRequest);
      } else {
        await membersService.create(formData as CreateMemberRequest);
      }
      setIsDialogOpen(false);
      fetchMembers(); // Refresh the list
    } catch (err: any) {
      alert(err.message || "Error al guardar el miembro");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMember = async (id: string, name: string) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar al miembro "${name}"? Esta acción no se puede deshacer.`)) {
      try {
        await membersService.delete(id);
        fetchMembers(); // Refresh the list
      } catch (err: any) {
        alert(err.message || "Error al eliminar el miembro");
      }
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [page]);

  return (
    <DialogRoot open={isDialogOpen} onOpenChange={(e) => setIsDialogOpen(e.open)}>
      <Stack gap="8">
        <Flex justify="space-between" align="center">
          <Stack gap="1">
            <Heading size="2xl" fontWeight="bold">Administración de Miembros</Heading>
            <Text color="fg.muted" fontSize="md">
              Gestiona los accesos y roles de los integrantes de Alentapp.
            </Text>
          </Stack>
          <HStack gap="3">
            <Button variant="outline" onClick={fetchMembers} disabled={isLoading}>
              <LuRefreshCw /> Actualizar
            </Button>
            <Button colorPalette="blue" size="md" onClick={openCreateModal}>
              <LuPlus /> Agregar Miembro
            </Button>
          </HStack>
        </Flex>

        {/* Modal para agregar/editar miembro */}
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingMemberId ? "Editar Miembro" : "Agregar Nuevo Miembro"}</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <Stack gap="4">
                <Field label="Nombre Completo" required>
                  <Input 
                    placeholder="Ej. Juan Pérez" 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </Field>
                <Field label="DNI" required>
                  <Input 
                    placeholder="Ej. 12345678" 
                    value={formData.dni}
                    onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                    required
                  />
                </Field>
                <Field label="Correo Electrónico" required>
                  <Input 
                    type="email" 
                    placeholder="ejemplo@correo.com" 
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </Field>
                <Field label="Fecha de Nacimiento" required>
                  <Input 
                    type="date" 
                    value={formData.birthdate}
                    onChange={(e) => setFormData({ ...formData, birthdate: e.target.value })}
                    required
                  />
                </Field>
                <Field label="Categoría" required>
                  <SelectRoot 
                    collection={categories} 
                    value={[formData.category]}
                    onValueChange={(e) => setFormData({ ...formData, category: e.value[0] as MemberCategory })}
                  >
                    <SelectTrigger>
                      <SelectValueText placeholder="Seleccione una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.items.map((cat) => (
                        <SelectItem item={cat} key={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </SelectRoot>
                </Field>
                
                {editingMemberId && formData.status && (
                  <Field label="Estado" required>
                    <SelectRoot 
                      collection={statusCategories} 
                      value={[formData.status]}
                      onValueChange={(e) => setFormData({ ...formData, status: e.value[0] as MemberStatus })}
                    >
                      <SelectTrigger>
                        <SelectValueText placeholder="Seleccione el estado" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusCategories.items.map((stat) => (
                          <SelectItem item={stat} key={stat.value}>
                            {stat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </SelectRoot>
                  </Field>
                )}
              </Stack>
            </DialogBody>
            <DialogFooter>
              <DialogActionTrigger asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogActionTrigger>
              <Button type="submit" colorPalette="blue" loading={isSubmitting}>
                {editingMemberId ? "Guardar Cambios" : "Crear Miembro"}
              </Button>
            </DialogFooter>
            <DialogCloseTrigger />
          </form>
        </DialogContent>

      {error && (
        <Box p="4" bg="red.50" color="red.700" borderRadius="md" border="1px solid" borderColor="red.200">
          <Text fontWeight="bold">Error:</Text>
          <Text>{error}</Text>
        </Box>
      )}

      <Box 
        bg="bg.panel" 
        borderRadius="xl" 
        boxShadow="sm" 
        borderWidth="1px" 
        overflow="hidden"
        minH="300px"
        position="relative"
      >
        {isLoading ? (
          <Center h="300px">
            <Stack align="center" gap="4">
              <Spinner size="xl" color="blue.500" />
              <Text color="fg.muted">Cargando miembros...</Text>
            </Stack>
          </Center>
        ) : members.length === 0 ? (
          <Center h="300px">
            <Stack align="center" gap="4">
              <Text color="fg.muted">No se encontraron miembros.</Text>
              <Button variant="ghost" onClick={fetchMembers}>Reintentar</Button>
            </Stack>
          </Center>
        ) : (
          <Table.Root size="md" variant="line" interactive>
            <Table.Header>
              <Table.Row bg="bg.muted/50">
                <Table.ColumnHeader py="4">Nombre</Table.ColumnHeader>
                <Table.ColumnHeader py="4">DNI</Table.ColumnHeader>
                <Table.ColumnHeader py="4">Correo</Table.ColumnHeader>
                <Table.ColumnHeader py="4">Nacimiento</Table.ColumnHeader>
                <Table.ColumnHeader py="4">Categoría</Table.ColumnHeader>
                <Table.ColumnHeader py="4">Estado</Table.ColumnHeader>
                <Table.ColumnHeader py="4" textAlign="end">Acciones</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {members.map((member) => (
                <Table.Row key={member.id} _hover={{ bg: "bg.muted/30" }}>
                  <Table.Cell fontWeight="semibold" color="fg.emphasized">
                    {member.name}
                  </Table.Cell>
                  <Table.Cell color="fg.muted">{member.dni}</Table.Cell>
                  <Table.Cell color="fg.muted">{member.email}</Table.Cell>
                  <Table.Cell color="fg.muted">{member.birthdate}</Table.Cell>
                  <Table.Cell>
                    <Box 
                      display="inline-block" 
                      px="2" 
                      py="0.5" 
                      borderRadius="md" 
                      bg="blue.50" 
                      color="blue.700" 
                      fontSize="xs" 
                      fontWeight="bold"
                    >
                      {member.category}
                    </Box>
                  </Table.Cell>
                  <Table.Cell>
                    <Box 
                      display="inline-block" 
                      px="2" 
                      py="0.5" 
                      borderRadius="md" 
                      bg={member.status === 'Activo' ? 'green.50' : 'orange.50'} 
                      color={member.status === 'Activo' ? 'green.700' : 'orange.700'} 
                      fontSize="xs" 
                      fontWeight="bold"
                    >
                      {member.status}
                    </Box>
                  </Table.Cell>
                  <Table.Cell textAlign="end">
                    <HStack gap="2" justify="flex-end">
                      <IconButton 
                        variant="ghost" 
                        size="sm" 
                        aria-label="Editar miembro"
                        onClick={() => openEditModal(member)}
                      >
                        <LuPencil />
                      </IconButton>
                      <IconButton 
                        variant="ghost" 
                        size="sm" 
                        colorPalette="red" 
                        aria-label="Eliminar miembro"
                        onClick={() => handleDeleteMember(member.id, member.name)}
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
        {!isLoading && members.length > 0 && (
          <PaginationControls pagination={pagination} onPageChange={setPage} />
        )}
      </Box>
    </Stack>
  </DialogRoot>
);
}