import { z } from 'zod';

export const paginationQuerySchema = z.object({
  page: z
    .preprocess(
      (v) => (v === undefined || v === '' ? undefined : Number(v)),
      z
        .number({ message: 'El parámetro `page` debe ser un entero positivo' })
        .int({ message: 'El parámetro `page` debe ser un entero positivo' })
        .min(1, { message: 'El parámetro `page` debe ser un entero positivo' }),
    )
    .optional(),
  page_size: z
    .preprocess(
      (v) => (v === undefined || v === '' ? undefined : Number(v)),
      z
        .number({ message: 'El parámetro `page_size` debe ser un entero positivo' })
        .int({ message: 'El parámetro `page_size` debe ser un entero positivo' })
        .min(1, { message: 'El parámetro `page_size` debe ser un entero positivo' })
        .max(100, { message: 'El parámetro `page_size` no puede superar 100' }),
    )
    .optional(),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
