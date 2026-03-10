import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { pool } from "../config/db";
import { registerSchema } from "../schemas/auth.schema";

export async function register(req: Request, res: Response) {
    try {
        const parsed = registerSchema.safeParse(req.body);

        if (!parsed.success) {
            return res.status(400).json({
                message: "Validation failed",
                errors: parsed.error,
            });
        }

        const { username, email, password } = parsed.data;

        const existingUser = await pool.query(
            `
            SELECT id
            FROM users
            WHERE username = $1 OR email = $2
            `,
            [username, email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                message: "Username or email already in use",
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const result = await pool.query(
            `
            INSERT INTO users (username, email, password_hash)
            VALUES ($1, $2, $3)
            RETURNING id, username, email, created_at, updated_at
            `,
            [username, email, passwordHash]
        );

        return res.status(201).json({
            message: "User registered successfully",
            user: result.rows[0],
        });
    } catch (error) {
        console.error("Register error:", error);
        return res.status(500).json({
            message: "Internal server error",
        });
    }
}