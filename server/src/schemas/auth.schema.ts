import {z} from "zod";

export const registerSchema = z.object({
    username: z
        .string()
        .min(3, "Username-ul trebuie să aibă cel puțin 3 caractere.")
        .max(50, "Username-ul nu poate avea mai mult de 50 de caractere."),
    email: z.email("Adresa de email nu este validă."),
    password: z
        .string()
        .min(6, "Parola trebuie să aibă cel puțin 6 caractere.")
        .max(100, "Parola nu poate avea mai mult de 100 de caractere."),
});

export const loginSchema = z.object({
    email: z.email("Adresa de email nu este validă."),
    password: z
        .string()
        .min(1, "Parola este obligatorie."),
});

export type RegisterSchemaType = z.infer<typeof registerSchema>;
export type LoginSchemaType = z.infer<typeof loginSchema>;

/* Practic:
* export type RegisterSchemaType = {
    username: string;
    email: string;
    password: string;
}
* Dar z.infer ofera ceva mai safe si mai compact*/