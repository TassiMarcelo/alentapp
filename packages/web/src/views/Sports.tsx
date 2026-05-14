import {
  Button,
  Heading,
  Stack,
  Text,
  Input,
  Box,
} from '@chakra-ui/react';
import { useState } from 'react';
import { sportsService } from '../services/sports';
import type { SportDTO } from '@alentapp/shared';
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

export function SportsView() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastCreated, setLastCreated] = useState<SportDTO | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    cupoMaximo: '',
    precioAdicional: '',
    esFederado: false,
    requires_medical_certificate: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const sport = await sportsService.create({
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        cupoMaximo: Number(formData.cupoMaximo),
        precioAdicional: Number(formData.precioAdicional || 0),
        esFederado: formData.esFederado,
        requires_medical_certificate: formData.requires_medical_certificate,
      });
      setLastCreated(sport);
      setIsDialogOpen(false);
      setFormData({ 
        nombre: '', 
        descripcion: '', 
        cupoMaximo: '', 
        precioAdicional: '', 
        esFederado: false, 
        requires_medical_certificate: false 
      });
    } catch (err: any) {
      alert(err.message || 'Error al crear el deporte');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DialogRoot open={isDialogOpen} onOpenChange={(e) => setIsDialogOpen(e.open)}>
      <Stack gap="8">
        <Heading size="2xl" fontWeight="bold">Catálogo de Deportes</Heading>

        <Button colorPalette="blue" onClick={() => setIsDialogOpen(true)}>
          Agregar Deporte
        </Button>

        {lastCreated && (
          <Text color="green.600">
            Deporte '{lastCreated.nombre}' creado exitosamente con cupo de {lastCreated.cupoMaximo}.
          </Text>
        )}

        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Agregar Nuevo Deporte</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <Stack gap="4">
                <Field label="Nombre" required>
                  <Input
                    placeholder="Ej. Basquet"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    required
                  />
                </Field>
                <Field label="Descripción">
                  <Input
                    placeholder="Breve descripción"
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  />
                </Field>
                <Field label="Cupo Máximo" required>
                  <Input
                    type="number"
                    min={1}
                    placeholder="Ej. 15"
                    value={formData.cupoMaximo}
                    onChange={(e) => setFormData({ ...formData, cupoMaximo: e.target.value })}
                    required
                  />
                </Field>
                <Field label="Precio Adicional ($)">
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    placeholder="Ej. 1200"
                    value={formData.precioAdicional}
                    onChange={(e) => setFormData({ ...formData, precioAdicional: e.target.value })}
                  />
                </Field>
                
                <Box display="flex" alignItems="center" gap="2" mt="2">
                  <input
                    type="checkbox"
                    id="esFederado"
                    checked={formData.esFederado}
                    onChange={(e) => setFormData({ ...formData, esFederado: e.target.checked })}
                  />
                  <label htmlFor="esFederado">Es Federado</label>
                </Box>

                <Box display="flex" alignItems="center" gap="2">
                  <input
                    type="checkbox"
                    id="requiresMedical"
                    checked={formData.requires_medical_certificate}
                    onChange={(e) => setFormData({ ...formData, requires_medical_certificate: e.target.checked })}
                  />
                  <label htmlFor="requiresMedical">Requiere Certificado Médico</label>
                </Box>

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
