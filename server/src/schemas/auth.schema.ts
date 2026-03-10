import { z } from "zod";

export const registerSchema = z.object({
    username: z
        .string()
        .min(3, "Username must be at least 3 characters long")
        .max(50, "Username must not be longer than 50 characters."),
    email: z
        //.string()
        .email("Invalid email address"),
    password: z
        .string()
        .min(6, "Password must be at least 6 characters long")
        .max(100, "Password must be at most 100 characters long"),
})

export type RegisterSchemaType = z.infer<typeof registerSchema>;