import { NextFunction, Request, Response } from "express";

import { loginSchema, registerSchema } from "../schemas/auth.schema";
import { loginUser, registerUser } from "../services/auth.service";

export async function register(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const parsed = registerSchema.safeParse(req.body);

        if (!parsed.success) {
            return res.status(400).json({
                message: "Validation failed",
                errors: parsed.error.issues,
            });
        }

        const user = await registerUser(parsed.data);

        return res.status(201).json({
            message: "User registered successfully",
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
                message: "Validation failed",
                errors: parsed.error.issues,
            });
        }

        const result = await loginUser(parsed.data);

        return res.status(200).json({
            message: "Login successful",
            token: result.token,
            user: result.user,
        });
    } catch (error) {
        next(error);
    }
}