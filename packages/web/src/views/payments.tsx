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
  Input
} from "@chakra-ui/react";
import { LuPlus, LuRefreshCw, LuPencil } from "react-icons/lu";
import { useEffect, useState } from "react";
import { paymentsService } from "../services/payments";
import type { PaymentDTO } from "../types/payment";

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

export function PaymentsView() {
  const [payments, setPayments] = useState<PaymentDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // edición de monto (TDD-0015: solo pagos en estado Pendiente)
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentDTO | null>(null);
  const [editMonto, setEditMonto] = useState(0);

  // form
  const [formData, setFormData] = useState({
    memberId: "",
    monto: 0,
    mesReferencia: 1,
    anioReferencia: new Date().getFullYear(),
    fechaVencimiento: "",
  });

  const fetchPayments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await paymentsService.getAll();
      setPayments(data);
    } catch (err: any) {
      setError(err.message || "Error al cargar pagos");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await paymentsService.create(formData);
      setIsDialogOpen(false);
      fetchPayments();
    } catch (err: any) {
      alert(err.message || "Error al crear pago");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (payment: PaymentDTO) => {
    setEditingPayment(payment);
    setEditMonto(payment.monto);
    setIsEditOpen(true);
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayment) return;

    if (editMonto <= 0) {
      alert("El monto debe ser mayor a 0");
      return;
    }

    setIsUpdating(true);
    try {
      await paymentsService.update(editingPayment.id, { monto: editMonto });
      setIsEditOpen(false);
      setEditingPayment(null);
      fetchPayments();
    } catch (err: any) {
      alert(err.message || "Error al actualizar pago");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await paymentsService.cancel(id);
      fetchPayments();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handlePay = async (id: string) => {
    try {
      await paymentsService.pay(id);
      fetchPayments();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <DialogRoot open={isDialogOpen} onOpenChange={(e) => setIsDialogOpen(e.open)}>
      <Stack gap="8">

        {/* HEADER */}
        <Flex justify="space-between" align="center">
          <Stack gap="1">
            <Heading size="2xl">Administración de Pagos</Heading>
            <Text color="fg.muted">
              Gestiona cuotas, pagos y estados de los socios.
            </Text>
          </Stack>

          <HStack>
            <Button variant="outline" onClick={fetchPayments}>
              <LuRefreshCw /> Actualizar
            </Button>

            <Button colorPalette="blue" onClick={() => setIsDialogOpen(true)}>
              <LuPlus /> Nuevo Pago
            </Button>
          </HStack>
        </Flex>

        {/* MODAL */}
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Crear Pago</DialogTitle>
            </DialogHeader>

            <DialogBody>
              <Stack gap="4">
                <Field label="Member ID" required>
                  <Input
                    value={formData.memberId}
                    onChange={(e) =>
                      setFormData({ ...formData, memberId: e.target.value })
                    }
                  />
                </Field>

                <Field label="Monto" required>
                  <Input
                    type="number"
                    value={formData.monto}
                    onChange={(e) =>
                      setFormData({ ...formData, monto: Number(e.target.value) })
                    }
                  />
                </Field>

                <Field label="Mes" required>
                  <Input
                    type="number"
                    value={formData.mesReferencia}
                    onChange={(e) =>
                      setFormData({ ...formData, mesReferencia: Number(e.target.value) })
                    }
                  />
                </Field>

                <Field label="Año" required>
                  <Input
                    type="number"
                    value={formData.anioReferencia}
                    onChange={(e) =>
                      setFormData({ ...formData, anioReferencia: Number(e.target.value) })
                    }
                  />
                </Field>

                <Field label="Fecha Vencimiento" required>
                  <Input
                    type="date"
                    value={formData.fechaVencimiento}
                    onChange={(e) =>
                      setFormData({ ...formData, fechaVencimiento: e.target.value })
                    }
                  />
                </Field>
              </Stack>
            </DialogBody>

            <DialogFooter>
              <DialogActionTrigger asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogActionTrigger>

              <Button type="submit" colorPalette="blue" loading={isSubmitting}>
                Crear
              </Button>
            </DialogFooter>

            <DialogCloseTrigger />
          </form>
        </DialogContent>

        {/* MODAL EDITAR MONTO */}
        <DialogRoot
          open={isEditOpen}
          onOpenChange={(e) => {
            setIsEditOpen(e.open);
            if (!e.open) setEditingPayment(null);
          }}
        >
          <DialogContent>
            <form onSubmit={handleUpdateSubmit}>
              <DialogHeader>
                <DialogTitle>Editar Monto</DialogTitle>
              </DialogHeader>

              <DialogBody>
                <Stack gap="4">
                  <Text color="fg.muted">
                    Solo se puede modificar el monto de pagos en estado{" "}
                    <strong>Pendiente</strong>.
                  </Text>

                  <Field label="Monto" required>
                    <Input
                      type="number"
                      value={editMonto}
                      onChange={(e) => setEditMonto(Number(e.target.value))}
                    />
                  </Field>
                </Stack>
              </DialogBody>

              <DialogFooter>
                <DialogActionTrigger asChild>
                  <Button variant="outline">Cancelar</Button>
                </DialogActionTrigger>

                <Button type="submit" colorPalette="blue" loading={isUpdating}>
                  Guardar
                </Button>
              </DialogFooter>

              <DialogCloseTrigger />
            </form>
          </DialogContent>
        </DialogRoot>

        {/* ERROR */}
        {error && (
          <Box bg="red.50" p="4" borderRadius="md">
            <Text color="red.700">{error}</Text>
          </Box>
        )}

        {/* TABLA */}
        <Box bg="bg.panel" borderRadius="xl" borderWidth="1px" overflow="hidden">
          {isLoading ? (
            <Center h="300px">
              <Spinner size="xl" />
            </Center>
          ) : (
            <Table.Root>
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>ID</Table.ColumnHeader>
                  <Table.ColumnHeader>Socio</Table.ColumnHeader>
                  <Table.ColumnHeader>Monto</Table.ColumnHeader>
                  <Table.ColumnHeader>Mes</Table.ColumnHeader>
                  <Table.ColumnHeader>Año</Table.ColumnHeader>
                  <Table.ColumnHeader>Estado</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="end">Acciones</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>

              <Table.Body>
                {payments.map((p) => (
                  <Table.Row key={p.id}>
                    <Table.Cell>{p.id}</Table.Cell>
                    <Table.Cell>{p.memberId}</Table.Cell>
                    <Table.Cell>${p.monto}</Table.Cell>
                    <Table.Cell>{p.mesReferencia}</Table.Cell>
                    <Table.Cell>{p.anioReferencia}</Table.Cell>

                    <Table.Cell>
                      <Box
                        px="2"
                        py="1"
                        borderRadius="md"
                        bg={
                          p.estado === "Pagado"
                            ? "green.50"
                            : p.estado === "Cancelado"
                            ? "red.50"
                            : "orange.50"
                        }
                        color={
                          p.estado === "Pagado"
                            ? "green.700"
                            : p.estado === "Cancelado"
                            ? "red.700"
                            : "orange.700"
                        }
                      >
                        {p.estado}
                      </Box>
                    </Table.Cell>

                    <Table.Cell textAlign="end">
                      {p.estado === "Pendiente" && (
                        <HStack justify="flex-end">
                          <Button
                            size="sm"
                            variant="outline"
                            aria-label="Editar monto"
                            onClick={() => handleEdit(p)}
                          >
                            <LuPencil />
                          </Button>
                          <Button size="sm" onClick={() => handlePay(p.id)}>
                            Pagar
                          </Button>
                          <Button
                            size="sm"
                            colorPalette="red"
                            onClick={() => handleCancel(p.id)}
                          >
                            Cancelar
                          </Button>
                        </HStack>
                      )}
                    </Table.Cell>
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