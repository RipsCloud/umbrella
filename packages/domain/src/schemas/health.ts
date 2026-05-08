import { z } from "zod";

export const HealthResponseSchema = z.object({
  status: z.literal("ok"),
  module: z.literal("fevrips"),
  timestamp: z.string(),
});
