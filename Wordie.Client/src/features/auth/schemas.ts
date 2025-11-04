import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const registerSchema = loginSchema.extend({
  displayName: z.string().min(2, "Display name must be at least 2 characters"),
});

export type RegisterFormValues = z.infer<typeof registerSchema>;
