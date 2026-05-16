import { isAfter, isBefore, isValid, parseISO, startOfDay } from 'date-fns';
import { ValidationError } from '../errors.js';

export class MedicalCertificateValidator {

  // TDD-0018: expiry_date debe ser estrictamente posterior a issue_date
  validateDates(issueDate: string | Date, expiryDate: string | Date): void {
    const issue = typeof issueDate === 'string' ? parseISO(issueDate) : issueDate;
    const expiry = typeof expiryDate === 'string' ? parseISO(expiryDate) : expiryDate;

    if (!isValid(issue) || !isValid(expiry)) {
      throw new ValidationError('Las fechas proporcionadas no son válidas');
    }

    if (!isAfter(expiry, issue)) {
      throw new ValidationError('La expiryDate debe ser estrictamente posterior a issueDate');
    }
  }

  // TDD-0018 §Casos de Borde: no se admite un certificado ya vencido
  validateNotExpired(expiryDate: string | Date): void {
    const expiry = typeof expiryDate === 'string' ? parseISO(expiryDate) : expiryDate;

    if (!isValid(expiry)) {
      throw new ValidationError('Las fechas proporcionadas no son válidas');
    }

    if (isBefore(expiry, startOfDay(new Date()))) {
      throw new ValidationError(
        'No se puede registrar un certificado cuya fecha sea anterior a la fecha actual.',
      );
    }
  }
}
