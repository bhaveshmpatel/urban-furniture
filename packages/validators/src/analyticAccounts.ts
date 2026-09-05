import { z } from "zod";

export const analyticAccountSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required"),
});

export type AnalyticAccountInput = z.infer<typeof analyticAccountSchema>;
