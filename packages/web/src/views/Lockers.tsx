import {
  Button,
  Heading,
  Stack,
  Text,
  Input,
} from '@chakra-ui/react';
import { useState } from 'react';
import { lockersService } from '../services/lockers';
import type { LockerDTO, LockerUbicacion } from '@alentapp/shared';
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

const ubicacionOptions = createListCollection({
  items: [
    { label: 'Vestuario Masculino', value: 'VESTUARIO_MASCULINO' },
    { label: 'Vestuario Femenino', value: 'VESTUARIO_FEMENINO' },
    { label: 'Niños', value: 'NINOS' },
  ],
});

export function LockersView() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastCreated, setLastCreated] = useState<LockerDTO | null>(null);
  const [formData, setFormData] = useState({
    numero: '',
    ubicacion: 'VESTUARIO_MASCULINO' as LockerUbicacion,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const locker = await lockersService.create({
        numero: Number(formData.numero),
        ubicacion: formData.ubicacion,
      });
      setLastCreated(locker);
      setIsDialogOpen(false);
      setFormData({ numero: '', ubicacion: 'VESTUARIO_MASCULINO' });
    } catch (err: any) {
      alert(err.message || 'Error al crear el locker');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DialogRoot open={isDialogOpen} onOpenChange={(e) => setIsDialogOpen(e.open)}>
      <Stack gap="8">
        <Heading size="2xl" fontWeight="bold">Administración de Lockers</Heading>

        <Button colorPalette="blue" onClick={() => setIsDialogOpen(true)}>
          Agregar Locker
        </Button>

        {lastCreated && (
          <Text color="green.600">
            Locker #{lastCreated.numero} creado exitosamente en {lastCreated.ubicacion}.
          </Text>
        )}

        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Agregar Nuevo Locker</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <Stack gap="4">
                <Field label="Número" required>
                  <Input
                    type="number"
                    min={1}
                    placeholder="Ej. 1"
                    value={formData.numero}
                    onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                    required
                  />
                </Field>
                <Field label="Ubicación" required>
                  <SelectRoot
                    collection={ubicacionOptions}
                    value={[formData.ubicacion]}
                    onValueChange={(e) => setFormData({ ...formData, ubicacion: e.value[0] as LockerUbicacion })}
                  >
                    <SelectTrigger>
                      <SelectValueText />
                    </SelectTrigger>
                    <SelectContent>
                      {ubicacionOptions.items.map((opt) => (
                        <SelectItem item={opt} key={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </SelectRoot>
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
      </Stack>
    </DialogRoot>
  );
}