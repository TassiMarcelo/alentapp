import { describe, it, expect } from 'vitest';
import { SportValidator } from './SportValidator.js';

describe('SportValidator', () => {
  const validator = new SportValidator();

  describe('validateCupoMaximo', () => {
    it('debe lanzar error si el nuevo cupo es 0 o negativo', () => {
      expect(() => validator.validateCupoMaximo(0, 0)).toThrow('El cupo debe ser mayor a cero');
      expect(() => validator.validateCupoMaximo(-5, 0)).toThrow('El cupo debe ser mayor a cero');
    });

    it('debe lanzar error si el nuevo cupo es menor a los inscriptos actuales', () => {
      expect(() => validator.validateCupoMaximo(3, 5)).toThrow(
        'No se puede reducir el cupo por debajo de los 5 socios ya inscriptos',
      );
    });
  });
});