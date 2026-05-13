import { LockerEstado } from '@alentapp/shared';

const TRANSICIONES_PERMITIDAS: Record<LockerEstado, LockerEstado[]> = {
    DISPONIBLE: ['OCUPADO', 'MANTENIMIENTO'],
    OCUPADO: ['DISPONIBLE'],
    MANTENIMIENTO: ['DISPONIBLE'],
};

const TRANSICIONES_PROHIBIDAS: Partial<Record<LockerEstado, Partial<Record<LockerEstado, string>>>> = {
    OCUPADO: {
        MANTENIMIENTO: 'No se puede enviar a mantenimiento un locker ocupado, debe liberarse primero',
    },
    MANTENIMIENTO: {
        OCUPADO: 'No se puede asignar un locker en mantenimiento, debe estar disponible primero',
    },
};

export class LockerEstadoValidator {
    validarTransicion(estadoActual: LockerEstado, nuevoEstado: LockerEstado): void {
        if (estadoActual === nuevoEstado) {
            throw new Error('El locker ya se encuentra en ese estado');
        }

        const prohibido = TRANSICIONES_PROHIBIDAS[estadoActual]?.[nuevoEstado];
        if (prohibido) {
            throw new Error(prohibido);
        }

        const permitidos = TRANSICIONES_PERMITIDAS[estadoActual];
        if (!permitidos.includes(nuevoEstado)) {
            throw new Error('Transición de estado no permitida');
        }
    }
}