import { z } from "zod";

/**
 * Client-side validation only mirrors the backend contract for fast
 * feedback (required fields, basic shape). Django's actual password
 * validators (common-password check, similarity to username/email,
 * etc.) run server-side and are the final authority -- their errors
 * are surfaced via setError() from the API response.
 */
export const registerSchema = z
  .object({
    name: z.string().trim().min(1, "required"),
    username: z
      .string()
      .trim()
      .min(3, "usernameMin")
      .max(150, "usernameMax")
      .regex(/^[\w.@+-]+$/, "usernameInvalid"),
    email: z.string().trim().min(1, "required").email("emailInvalid"),
    password: z.string().min(8, "passwordMin"),
    confirmPassword: z.string().min(1, "required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "passwordMismatch",
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;
