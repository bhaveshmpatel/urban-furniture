import { z } from 'zod';

export const ProductType = z.enum(['GOODS', 'SERVICE', 'COMBO']);

export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  type: ProductType,
  salesPrice: z.number().positive('Sales price must be a positive number'),
  costPrice: z.number().positive('Cost price must be a positive number'),
  category: z.string().optional(),
});

export const updateProductSchema = createProductSchema.partial();

export type ProductTypeEnum = z.infer<typeof ProductType>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
