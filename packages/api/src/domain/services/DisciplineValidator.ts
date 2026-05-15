import { isAfter, isValid } from 'date-fns';

export class DisciplineValidator {
  validateDates(start: Date, end: Date): void {
    if (!isValid(start) || !isValid(end)) {
      throw new Error('Fechas inválidas');
    }
    if (!isAfter(end, start)) {
      throw new Error('La fecha de fin debe ser posterior a la de inicio');
    }
  }
}
