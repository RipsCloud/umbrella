import { z } from "zod";

export const CreateExampleInputSchema = z.object({
  slug: z.string().min(1),
  displayName: z.string().min(1),
});

export const ExampleResponseSchema = z.object({
  id: z.string(),
  slug: z.string(),
  displayName: z.string(),
  status: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
