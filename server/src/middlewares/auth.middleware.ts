import {NextFunction, Request, Response} from "express";
import jwt from "jsonwebtoken";

import { env } from "../config/env";

export interface AuthRequest extends Request {
    user?: {
        userId: number;
        username: string;
        email: string;
    };
}

export function authMiddleware(
    req: AuthRequest,
    res: Response,
    next: NextFunction
) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "Missing or invalid authorization header",
        });
    }

    const token = authHeader.split(" ")[1];
    const secret = env.jwtSecret;

    try {
        const decoded = jwt.verify(token, secret);

        if (typeof decoded === "string") {
            return res.status(401).json({
                message: "Invalid token payload",
            });
        }

        if (
            typeof decoded.userId !== "number" ||
            typeof decoded.username !== "string" ||
            typeof decoded.email !== "string"
        ) {
            return res.status(401).json({
                message: "Invalid token payload",
            });
        }

        req.user = {
            userId: decoded.userId,
            username: decoded.username,
            email: decoded.email,
        };

        next();
    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired token",
        });
    }
}