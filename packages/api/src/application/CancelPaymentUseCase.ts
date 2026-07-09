import { PaymentRepository } from '../domain/PaymentRepository.js'; 
import { MemberRepository } from '../domain/MemberRepository.js'; 
import { PaymentDTO } from '@alentapp/shared'; 
import { PaymentValidator } from '../domain/services/PaymentValidator.js'; 
 
export class CancelPaymentUseCase { 
 
    constructor( 

        private readonly paymentRepo: PaymentRepository, 

        private readonly memberRepo: MemberRepository 

    ) {} 
  

    async execute(id: string): Promise<PaymentDTO> { 

  
        try { 

  
            // 1. Validar ID 

            PaymentValidator.validatePaymentId(id); 


            // 2. Buscar pago 

            const existingPayment = 

            await this.paymentRepo.findById(id); 
  
            PaymentValidator.validatePaymentExists(existingPayment); 


            // 3. Buscar socio 

           PaymentValidator.validateMemberId(existingPayment.memberId); 

           const member = await this.memberRepo.findById(existingPayment.memberId); 

           PaymentValidator.validateMemberExists(member); 

   
           // 4. Validar estado 

            PaymentValidator.validatePaymentNotPaid( 

                existingPayment.estado 

            ); 

  
            PaymentValidator.validatePaymentNotCancelled( 

                existingPayment.estado 

            ); 

  
            // 5. Actualizar estado 

            return await this.paymentRepo.update( 

                id, 

                { 
                    estado: 'Cancelado' 
                } 
            ); 

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

