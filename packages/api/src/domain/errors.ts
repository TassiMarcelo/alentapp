// Errores de dominio para mapear excepciones a códigos HTTP (TDD-0018 §Casos de Borde)

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

// El recurso existe pero ya fue eliminado (borrado lógico) -> 410 Gone
// (TDD-0020 §Casos de Borde y Errores)
export class GoneError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GoneError';
  }
}
