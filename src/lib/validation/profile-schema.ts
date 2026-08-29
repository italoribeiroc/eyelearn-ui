import { z } from "zod";

export const profileSchema = z.object({
  name: z.string().trim().min(1, "required"),
  username: z
    .string()
    .trim()
    .min(3, "usernameMin")
    .max(150, "usernameMax")
    .regex(/^[\w.@+-]+$/, "usernameInvalid"),
  email: z.string().trim().min(1, "required").email("emailInvalid"),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
