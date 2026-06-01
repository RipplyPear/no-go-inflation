import { NextFunction, Request, Response } from "express";
import type { ZodError } from "zod";

import { loginSchema, registerSchema } from "../schemas/auth.schema";
import { loginUser, registerUser } from "../services/auth.service";

function getValidationMessage(error: ZodError): string {
    return error.issues[0]?.message ?? "Datele introduse nu sunt valide.";
}

export async function register(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const parsed = registerSchema.safeParse(req.body);

        if (!parsed.success) {
            return res.status(400).json({
                message: getValidationMessage(parsed.error),
                errors: parsed.error.issues,
            });
        }

        const user = await registerUser(parsed.data);

        return res.status(201).json({
            message: "Cont creat cu succes.",
            user,
        });
    } catch (error) {
        next(error);
    }
}

export async function login(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const parsed = loginSchema.safeParse(req.body);

        if (!parsed.success) {
            return res.status(400).json({
                message: getValidationMessage(parsed.error),
                errors: parsed.error.issues,
            });
        }

        const result = await loginUser(parsed.data);

        return res.status(200).json({
            message: "Autentificare reușită.",
            token: result.token,
            user: result.user,
        });
    } catch (error) {
        next(error);
    }
}