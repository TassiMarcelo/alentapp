import { PaymentRepository } from '../domain/PaymentRepository.js'; 
import { MemberRepository } from '../domain/MemberRepository.js'; 
import { PaymentDTO, PayPaymentRequest } from '@alentapp/shared'; 
import { PaymentValidator } from '../domain/services/PaymentValidator.js'; 
  
export class PayPaymentUseCase { 

    constructor( 

        private readonly paymentRepo: PaymentRepository, 

        private readonly memberRepo: MemberRepository 

    ) {} 
  

    async execute( 

        id: string, 

        data: PayPaymentRequest 

    ): Promise<PaymentDTO> { 

  
        try { 

            // 1. Validar ID 

            PaymentValidator.validatePaymentId(id); 
  

            // 2. Validar fecha de pago 

            const fechaPago = 

                PaymentValidator.validateFechaPago( 

                    data.fechaPago 

                ); 

  
            // 3. Buscar pago 

            const existingPayment = 
 
            await this.paymentRepo.findById(id); 

            PaymentValidator.validatePaymentExists( 

                existingPayment 

            ); 
  

            // 4. Buscar socio 

            PaymentValidator.validateMemberId(existingPayment.memberId); 

            const member = await this.memberRepo.findById(existingPayment.memberId); 

            PaymentValidator.validateMemberExists(member); 


           // 5. Validar vencimiento 

            PaymentValidator.validatePaymentNotExpired( 

                existingPayment.fechaVencimiento 

            ); 

  
            // 6. Validar estado 

            PaymentValidator.validatePaymentStatusForPay( 

                existingPayment.estado 

            ); 


            // 7. Persistir cambio 

            return await this.paymentRepo.update( 

                id, 

                { 
                    estado: 'Pagado', 

                    fechaPago: fechaPago.toISOString() 
                } 
            ); 

  
        } catch (error: any) { 

  
            if ( 

                error.message.startsWith('400') || 

                error.message.startsWith('404') 

            ) { 

                throw error; 

            } 


            throw new Error( 

                '500: Error de base de datos' 

            ); 
        } 
    }  
}
