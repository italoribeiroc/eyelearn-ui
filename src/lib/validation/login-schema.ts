import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().trim().min(1, "required"),
  password: z.string().min(1, "required"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
