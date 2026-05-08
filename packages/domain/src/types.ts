import type { z } from "zod";
import type {
  HealthResponseSchema,
  CreateExampleInputSchema,
  ExampleResponseSchema,
} from "./schemas/index";

export type HealthResponse = z.infer<typeof HealthResponseSchema>;
export type CreateExampleInput = z.infer<typeof CreateExampleInputSchema>;
export type ExampleResponse = z.infer<typeof ExampleResponseSchema>;
