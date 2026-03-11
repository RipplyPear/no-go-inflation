import { z } from "zod";

export const registerSchema = z.object({
    username: z
        .string()
        .min(3, "Username must be at least 3 characters long")
        .max(50, "Username must not be longer than 50 characters."),
    email: z.email("Invalid email address"),
    password: z
        .string()
        .min(6, "Password must be at least 6 characters long")
        .max(100, "Password must be at most 100 characters long"),
})

export const loginSchema = z.object({
    email: z.email("Invalid email address"),
    password: z
        .string()
        .min(1, "Password is required"),
});

export type RegisterSchemaType = z.infer<typeof registerSchema>;
export type LoginSchemaType = z.infer<typeof loginSchema>;