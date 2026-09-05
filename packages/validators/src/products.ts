import { z } from 'zod';
export const createProductSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['GOODS', 'SERVICE', 'COMBO']),
  salesPrice: z.number().positive(),
  costPrice: z.number().positive(),
  category: z.string().optional()
});
export const updateProductSchema = createProductSchema.partial();
