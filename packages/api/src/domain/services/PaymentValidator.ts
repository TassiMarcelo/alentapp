export class PaymentValidator { 

    static validatePaymentId(id: string): void { 

    if (!id || id.trim() === '') { 

        throw new Error( 

            '400: El ID del pago es obligatorio' 

        ); 
    }  
} 
 

  static validatePaymentExists(payment: PaymentDTO | null): asserts payment is PaymentDTO { 

    if (!payment) { 

        throw new Error( 

            '404: El pago no existe' 

        ); 
    }  
} 

    static validateMemberId(memberId: string | undefined): void { 

        if (!memberId) { 

            throw new Error('404: El socio no existe'); 
        } 
    } 

 
    static validateMemberExists(member: MemberDTO | null): asserts member is MemberDTO { 

    if (!member) { 

        throw new Error('404: El socio no existe'); 

    } 
} 

 
    static validateDuplicatePayment(payment: PaymentDTO | null): void { 

    if (payment) { 

        throw new Error( 

            '409: Ya existe un pago para ese período' 

        ); 
    }  
} 

 
    static validateMonto(monto: number): void { 

         if (monto <= 0) { 

            throw new Error('400: El monto debe ser mayor a 0'); 
        } 
     } 

 

    static validateMesReferencia(mes: number): void { 

         if ( 

            !Number.isInteger(mes) || 

            mes < 1 || 

            mes > 12 

        ) { 

            throw new Error('400: Mes de referencia inválido'); 

        }  
    } 

 

    static validateAnioReferencia(anio: number): void { 

         if ( 

            !Number.isInteger(anio) || 

            anio < 2026 || 

            anio > 2036 

        ) { 

            throw new Error('400: Año de referencia inválido'); 

        } 
     } 

 

    static validateFechaVencimiento(fecha: string): void { 

    const fechaVencimiento = new Date(fecha); 

     // Verificar formato 

    if (isNaN(fechaVencimiento.getTime())) { 

        throw new Error('400: Fecha de vencimiento inválida'); 

    } 

    // Comparar sólo la fecha 

    const hoy = new Date(); 

     hoy.setHours(0, 0, 0, 0); 

    fechaVencimiento.setHours(0, 0, 0, 0); 

    if (fechaVencimiento < hoy) { 

        throw new Error( 

            '400: La fecha de vencimiento no puede ser anterior a hoy' 

        ); 
    }  
} 

 

    static validateFechaPago(fecha: string): Date { 

    if (!fecha) { 

        throw new Error( 

            '400: La fecha de pago es obligatoria' 

        ); 
    } 

    const fechaPago = new Date(fecha); 

    if (isNaN(fechaPago.getTime())) { 

        throw new Error( 

            '400: Fecha inválida' 

        ); 
    } 

    return fechaPago;  
} 

 

    static validatePendingStatus(estado: 'Pendiente' | 'Pagado' | 'Cancelado'): void { 

    if (estado !== 'Pendiente') { 

        throw new Error( 

            '400: Solo se pueden modificar pagos en estado Pendiente' 
        ); 
    }  
} 

 

    static validatePaymentNotPaid(estado: 'Pendiente' | 'Pagado' | 'Cancelado'): void { 

    if (estado === 'Pagado') { 

        throw new Error( 

            '400: No se puede cancelar un pago ya realizado' 

        ); 
    }  
} 

  

    static validatePaymentNotCancelled(estado: 'Pendiente' | 'Pagado' | 'Cancelado'): void { 


    if (estado === 'Cancelado') { 

        throw new Error( 

            '400: El pago ya está cancelado' 

        ); 
    } 
} 

 

    static validatePaymentStatusForPay(estado: 'Pendiente' | 'Pagado' | 'Cancelado'): void { 

    if (estado === 'Pagado') { 

        throw new Error( 

            '400: El pago ya fue realizado' 

        ); 
    } 

    if (estado === 'Cancelado') { 

        throw new Error( 

            '400: El pago está cancelado' 
        ); 
    } 

    if (estado !== 'Pendiente') { 

        throw new Error( 

            '400: El pago no está en estado válido para ser procesado' 

        ); 
    } 
 }  

 

    static validatePaymentNotExpired(fechaVencimiento: string): void { 

    const hoy = new Date(); 

    const vencimiento = new Date(fechaVencimiento);   

    hoy.setHours(0, 0, 0, 0); 

    vencimiento.setHours(0, 0, 0, 0); 

  
    if (hoy > vencimiento) { 

        throw new Error( 

            '400: El pago está vencido' 

        ); 
    }  
} 

} 