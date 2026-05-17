import Fastify from 'fastify';
import cors from '@fastify/cors';
import { PostgresMemberRepository } from './infrastructure/PostgresMemberRepository.js';
import { MemberValidator } from './domain/services/MemberValidator.js';
import { CreateMemberUseCase } from './application/NewMemberUseCase.js';
import { GetMembersUseCase } from './application/GetMembersUseCase.js';
import { UpdateMemberUseCase } from './application/UpdateMemberUseCase.js';
import { DeleteMemberUseCase } from './application/DeleteMemberUseCase.js';
import { MemberController } from './delivery/MemberController.js';
import { PostgresLockerRepository } from './infrastructure/PostgresLockerRepository.js';
import { GetLockersUseCase } from './application/GetLockersUseCase.js';
import { CreateLockerUseCase } from './application/CreateLockerUseCase.js';
import { LockerController } from './delivery/LockerController.js';
import { PostgresSportRepository } from './infrastructure/PostgresSportRepository.js';
import { CreateSportUseCase } from './application/CreateSportUseCase.js';
import { UpdateSportUseCase } from './application/UpdateSportUseCase.js';
import { GetSportsUseCase } from './application/GetSportsUseCase.js';
import { DeleteSportUseCase } from './application/DeleteSportUseCase.js';
import { SportValidator } from './domain/services/SportValidator.js';
import { SportController } from './delivery/SportController.js';
import { UpdateLockerEstadoUseCase } from './application/UpdateLockerEstadoUseCase.js';
import { LockerEstadoValidator } from './domain/services/LockerEstadoValidator.js';
import { UpdateLockerUseCase } from './application/UpdateLockerUseCase.js';
import { DeleteLockerUseCase } from './application/DeleteLockerUseCase.js';
import { PostgresDisciplineRepository } from './infrastructure/PostgresDisciplineRepository.js';
import { DisciplineValidator } from './domain/services/DisciplineValidator.js';
import { CreateDisciplineUseCase } from './application/CreateDisciplineUseCase.js';
import { ListDisciplinesUseCase } from './application/ListDisciplinesUseCase.js';
import { UpdateDisciplineUseCase } from './application/UpdateDisciplineUseCase.js';
import { DeleteDisciplineUseCase } from './application/DeleteDisciplineUseCase.js';
import { DisciplineController } from './delivery/DisciplineController.js';
import { PostgresMedicalCertificateRepository } from './infrastructure/PostgresMedicalCertificateRepository.js';
import { CreateMedicalCertificateUseCase } from './application/CreateMedicalCertificateUseCase.js';
import { GetMedicalCertificatesUseCase } from './application/GetMedicalCertificatesUseCase.js';
import { UpdateMedicalCertificateUseCase } from './application/UpdateMedicalCertificateUseCase.js';
import { DeleteMedicalCertificateUseCase } from './application/DeleteMedicalCertificateUseCase.js';
import { MedicalCertificateController } from './delivery/MedicalCertificateController.js';
import { PostgresPaymentRepository } from './infrastructure/PostgresPaymentRepository.js';
import { NewPaymentUseCase } from './application/NewPaymentUseCase.js';
import { GetPaymentsUseCase } from './application/GetPaymentsUseCase.js';
import { UpdatePaymentUseCase } from './application/UpdatePaymentUseCase.js';
import { CancelPaymentUseCase } from './application/CancelPaymentUseCase.js';
import { PayPaymentUseCase } from './application/PayPaymentUseCase.js';
import { PaymentController } from './delivery/PaymentController.js';

export function buildApp() {
    const server = Fastify({
        logger: {
            level: 'info',
            transport: process.env.NODE_ENV === 'development' 
            ? {
                target: 'pino-pretty',
                options: { translateTime: 'HH:MM:ss Z', ignore: 'pid,hostname' },
                } 
            : undefined,
        },
    });

    server.register(cors, {
        origin: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
    });

    const memberRepo = new PostgresMemberRepository();
    const memberValidator = new MemberValidator(memberRepo);
    
    const createMemberUseCase = new CreateMemberUseCase(memberRepo, memberValidator);
    const getMembersUseCase = new GetMembersUseCase(memberRepo);
    const updateMemberUseCase = new UpdateMemberUseCase(memberRepo, memberValidator);
    const deleteMemberUseCase = new DeleteMemberUseCase(memberRepo);

    const memberController = new MemberController(
        createMemberUseCase, 
        getMembersUseCase,
        updateMemberUseCase,
        deleteMemberUseCase
    );

    
    server.get('/api/v1/socios', memberController.getAll.bind(memberController));
    server.post('/api/v1/socios', memberController.create.bind(memberController));
    server.put('/api/v1/socios/:id', memberController.update.bind(memberController));
    server.delete('/api/v1/socios/:id', memberController.delete.bind(memberController));

    
    //lokers

    const lockerRepo = new PostgresLockerRepository();
    const getLockersUseCase = new GetLockersUseCase(lockerRepo);
    const createLockerUseCase = new CreateLockerUseCase(lockerRepo);
    const lockerEstadoValidator = new LockerEstadoValidator();
    const updateLockerEstadoUseCase = new UpdateLockerEstadoUseCase(lockerRepo, memberRepo, lockerEstadoValidator);
    const updateLockerUseCase = new UpdateLockerUseCase(lockerRepo);
    const deleteLockerUseCase = new DeleteLockerUseCase(lockerRepo);
    const lockerController = new LockerController(getLockersUseCase, createLockerUseCase, updateLockerEstadoUseCase, updateLockerUseCase, deleteLockerUseCase);


    server.post('/api/v1/lockers', lockerController.create.bind(lockerController));
    server.get('/api/v1/lockers', lockerController.getAll.bind(lockerController));
    server.put('/api/v1/lockers/:id/estado', lockerController.updateEstado.bind(lockerController));
    server.put('/api/v1/lockers/:id', lockerController.update.bind(lockerController));
    server.delete('/api/v1/lockers/:id', lockerController.delete.bind(lockerController));

    // sports
    const sportRepo = new PostgresSportRepository();
    const sportValidator = new SportValidator();
    const getSportsUseCase = new GetSportsUseCase(sportRepo);
    const createSportUseCase = new CreateSportUseCase(sportRepo);
    const updateSportUseCase = new UpdateSportUseCase(sportRepo, sportValidator);
    const deleteSportUseCase = new DeleteSportUseCase(sportRepo);
    const sportController = new SportController(getSportsUseCase, createSportUseCase, updateSportUseCase, deleteSportUseCase);

    server.get('/api/v1/sports', sportController.getAll.bind(sportController));
    server.post('/api/v1/sports', sportController.create.bind(sportController));
    server.put('/api/v1/sports/:id', sportController.update.bind(sportController));
    server.delete('/api/v1/sports/:id', sportController.delete.bind(sportController));
    
    // disciplines
    const disciplineRepo = new PostgresDisciplineRepository();
    const disciplineValidator = new DisciplineValidator();
    const createDisciplineUseCase = new CreateDisciplineUseCase(disciplineRepo, memberRepo, disciplineValidator);
    const listDisciplinesUseCase = new ListDisciplinesUseCase(disciplineRepo);
    const updateDisciplineUseCase = new UpdateDisciplineUseCase(disciplineRepo, disciplineValidator);
    const deleteDisciplineUseCase = new DeleteDisciplineUseCase(disciplineRepo);
    const disciplineController = new DisciplineController(createDisciplineUseCase, listDisciplinesUseCase, updateDisciplineUseCase, deleteDisciplineUseCase);

    server.post('/api/v1/disciplines', disciplineController.create.bind(disciplineController));
    server.get('/api/v1/disciplines', disciplineController.list.bind(disciplineController));
    server.patch('/api/v1/disciplines/:id', disciplineController.update.bind(disciplineController));
    server.delete('/api/v1/disciplines/:id', disciplineController.delete.bind(disciplineController));

    // medical certificates
    const medicalCertificateRepo = new PostgresMedicalCertificateRepository();
    const createMedicalCertificateUseCase = new CreateMedicalCertificateUseCase(medicalCertificateRepo, memberRepo);
    const getMedicalCertificatesUseCase = new GetMedicalCertificatesUseCase(medicalCertificateRepo);
    const updateMedicalCertificateUseCase = new UpdateMedicalCertificateUseCase(medicalCertificateRepo);
    const deleteMedicalCertificateUseCase = new DeleteMedicalCertificateUseCase(medicalCertificateRepo);
    const medicalCertificateController = new MedicalCertificateController(createMedicalCertificateUseCase, getMedicalCertificatesUseCase, updateMedicalCertificateUseCase, deleteMedicalCertificateUseCase);

    server.post('/api/v1/medical-certificates', medicalCertificateController.create.bind(medicalCertificateController));
    server.get('/api/v1/medical-certificates', medicalCertificateController.getAll.bind(medicalCertificateController));
    server.patch('/api/v1/medical-certificates/:id', medicalCertificateController.update.bind(medicalCertificateController));
    server.delete('/api/v1/medical-certificates/:id', medicalCertificateController.delete.bind(medicalCertificateController));

    // Payment

    const paymentRepo = new PostgresPaymentRepository();

    const newPaymentUseCase = new NewPaymentUseCase(paymentRepo, memberRepo);
    const getPaymentsUseCase = new GetPaymentsUseCase(paymentRepo);
    const updatePaymentUseCase = new UpdatePaymentUseCase(paymentRepo, memberRepo);
    const cancelPaymentUseCase = new CancelPaymentUseCase(paymentRepo, memberRepo);
    const payPaymentUseCase = new PayPaymentUseCase(paymentRepo);

    const paymentController = new PaymentController(
        newPaymentUseCase,
        getPaymentsUseCase,
        updatePaymentUseCase,
        cancelPaymentUseCase,
        payPaymentUseCase
    );

    server.get('/api/v1/payments', paymentController.getAll.bind(paymentController));
    server.post('/api/v1/payments', paymentController.create.bind(paymentController));
    server.put('/api/v1/payments/:id', paymentController.update.bind(paymentController));
    server.patch('/api/v1/payments/:id/cancel', paymentController.cancel.bind(paymentController));
    server.patch('/api/v1/payments/:id/pay', paymentController.pay.bind(paymentController));

    server.get('/', async (req, rep) => {
        rep.status(200).send({ msg: 'asd' })
    });

    return server;
}

// Solo iniciar el servidor si el script se ejecuta directamente (no cuando es importado por vitest)
if (process.argv[1] && process.argv[1].endsWith('app.ts')) {
    const server = buildApp();
    const port = parseInt(process.env.PORT || '3000', 10);

    server.listen({ port, host: '0.0.0.0' }, () =>
        server.log.info(`API server running on http://localhost:${port}`)
    );

    ['SIGINT', 'SIGTERM'].forEach((signal) => {
        process.on(signal, async () => {
            await server.close();
            process.exit(0);
        });
    });
}