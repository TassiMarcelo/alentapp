import { PaymentRepository } from '../domain/PaymentRepository.js'; 
import { MemberRepository } from '../domain/MemberRepository.js'; 
import { CreatePaymentRequest, PaymentDTO } from '@alentapp/shared'; 
import { PaymentValidator } from '../domain/services/PaymentValidator.js';  

  

export class NewPaymentUseCase { 

    constructor( 

        private readonly paymentRepository: PaymentRepository, 

        private readonly memberRepository: MemberRepository 

    ) {} 
  
    async execute(data: CreatePaymentRequest): Promise<PaymentDTO> { 

        try { 

            // 1. Validar existencia del socio 

            PaymentValidator.validateMemberId(data.memberId); 

            const member = await this.memberRepository.findById(data.memberId); 

            PaymentValidator.validateMemberExists(member); 

  
            // 2. Validación de negocio: evitar pagos duplicados 

            const existingPayment = 

                await this.paymentRepository.findByMemberAndPeriod( 

                    data.memberId, 

                    data.mesReferencia, 

                    data.anioReferencia 

                ); 

            PaymentValidator.validateDuplicatePayment(existingPayment); 

  

            // 3. Validaciones 

            PaymentValidator.validateFechaVencimiento( 

                data.fechaVencimiento 

            ); 

  
            PaymentValidator.validateMesReferencia( 

                data.mesReferencia 

            ); 

  
            PaymentValidator.validateAnioReferencia( 

                data.anioReferencia 

            ); 

  
            PaymentValidator.validateMonto( 

                data.monto 

            ); 

 
            // 4. Persistencia 

            return await this.paymentRepository.create({ 

            ...data, 

            estado: 'Pendiente', 

            created_at: new Date().toISOString() 
}); 

        } catch (error: any) { 

            if ( 

                error.message.startsWith('400') || 

                error.message.startsWith('404') || 

                error.message.startsWith('409') 

            ) { 

                throw error; 

            } 

            throw new Error('500: Error de base de datos'); 

        } 
     }  
}