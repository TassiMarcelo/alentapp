import { describe, it, expect } from 'vitest';
import { DisciplineValidator } from './DisciplineValidator.js';

describe('DisciplineValidator', () => {
  const validator = new DisciplineValidator();

  describe('validateDates', () => {
    it('debe lanzar "Fechas inválidas" si alguna de las fechas no es válida', () => {
      const valid = new Date('2026-05-01T00:00:00Z');
      const invalid = new Date('fecha-rota');

      expect(() => validator.validateDates(invalid, valid)).toThrow('Fechas inválidas');
      expect(() => validator.validateDates(valid, invalid)).toThrow('Fechas inválidas');
    });

    it('debe lanzar "La fecha de fin debe ser posterior a la de inicio" cuando end <= start', () => {
      const start = new Date('2026-05-01T00:00:00Z');
      const equal = new Date('2026-05-01T00:00:00Z');
      const earlier = new Date('2026-04-30T00:00:00Z');

      // end === start
      expect(() => validator.validateDates(start, equal)).toThrow(
        'La fecha de fin debe ser posterior a la de inicio',
      );
      // end < start
      expect(() => validator.validateDates(start, earlier)).toThrow(
        'La fecha de fin debe ser posterior a la de inicio',
      );
    });
  });
});
