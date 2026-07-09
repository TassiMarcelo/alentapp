import { PaymentRepository } from '../domain/PaymentRepository.js'; 
import { MemberRepository } from '../domain/MemberRepository.js'; 
import { PaymentDTO, UpdatePaymentRequest } from '@alentapp/shared'; 
import { PaymentValidator } from '../domain/services/PaymentValidator.js'; 

  
export class UpdatePaymentUseCase { 

    constructor( 

        private readonly paymentRepo: PaymentRepository, 

        private readonly memberRepo: MemberRepository 

    ) {} 

  
    async execute(id: string, data: UpdatePaymentRequest): Promise<PaymentDTO> { 

        try { 

            // 1. Validar existencia del pago 

            PaymentValidator.validatePaymentId(id); 

            const existingPayment = await this.paymentRepo.findById(id); 

             PaymentValidator.validatePaymentExists(existingPayment); 

  

            // 2. Validar existencia del socio  

            PaymentValidator.validateMemberId(existingPayment.memberId); 

            const member = await this.memberRepo.findById(existingPayment.memberId); 

            PaymentValidator.validateMemberExists(member); 

  

            // 3. Validar estado del pago 

            PaymentValidator.validatePendingStatus( 

                existingPayment.estado 

            ); 

  
            // 4. Validar monto si se envía 

            if (data.monto !== undefined) { 

                PaymentValidator.validateMonto(data.monto); 

            } 

              
            // 5. Armar objeto actualizado 

            const updatedData = { 

                ...data 

            }; 


            // 6. Persistir cambios 

            return await this.paymentRepo.update(id, updatedData); 
  
        } catch (error: any) { 


            if ( 

                error.message.startsWith('400') || 

                error.message.startsWith('404') 

            ) { 

                throw error; 

            } 
  
            throw new Error('500: Error de base de datos'); 

        } 
    }  
}