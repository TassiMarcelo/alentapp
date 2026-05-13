import { LockerDTO, UpdateLockerEstadoRequest, LockerEstado } from '@alentapp/shared';
import { LockerRepository } from '../domain/LockerRepository.js';
import { MemberRepository } from '../domain/MemberRepository.js';
import { LockerEstadoValidator } from '../domain/services/LockerEstadoValidator.js';

const VALID_ESTADOS: LockerEstado[] = ['DISPONIBLE', 'OCUPADO', 'MANTENIMIENTO'];

export class UpdateLockerEstadoUseCase {
    constructor(
        private readonly lockerRepository: LockerRepository,
        private readonly memberRepository: MemberRepository,
        private readonly lockerEstadoValidator: LockerEstadoValidator,
    ) {}

    async execute(id: string, data: UpdateLockerEstadoRequest): Promise<LockerDTO> {
        if (!id || id.trim() === '') {
            throw new Error('El id ingresado no es válido');
        }

        if (!data.estado || !VALID_ESTADOS.includes(data.estado)) {
            throw new Error('Estado inválido');
        }

        const locker = await this.lockerRepository.findById(id);
        if (!locker) {
            throw new Error('El locker no existe');
        }

        this.lockerEstadoValidator.validarTransicion(locker.estado, data.estado);

        if (data.estado === 'OCUPADO') {
            if (!data.memberId || !data.fechaFinContrato) {
                throw new Error('Para asignar un locker se requiere memberId y fechaFinContrato');
            }

            const fechaFin = new Date(data.fechaFinContrato);
            if (isNaN(fechaFin.getTime()) || fechaFin <= new Date()) {
                throw new Error('La fecha de fin debe ser futura');
            }

            const member = await this.memberRepository.findById(data.memberId);
            if (!member) {
                throw new Error('El socio no existe');
            }
        }

        return this.lockerRepository.updateEstado(id, data);
    }
}