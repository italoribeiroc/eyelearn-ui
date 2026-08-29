import { z } from "zod";

export const resetPasswordSchema = z
  .object({
    newPassword: z.string().min(8, "passwordMin"),
    confirmPassword: z.string().min(1, "required"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "passwordMismatch",
  });

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
