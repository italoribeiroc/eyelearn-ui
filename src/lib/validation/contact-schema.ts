import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().trim().min(1, "required").max(150, "required"),
  email: z.string().trim().min(1, "required").email("emailInvalid"),
  message: z.string().trim().min(10, "messageMin"),
});

export type ContactFormValues = z.infer<typeof contactSchema>;
