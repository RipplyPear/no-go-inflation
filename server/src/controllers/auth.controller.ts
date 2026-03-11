import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "../config/db";
import { loginSchema, registerSchema } from "../schemas/auth.schema";

export async function register(req: Request, res: Response) {
    try {
        const parsed = registerSchema.safeParse(req.body);

        if (!parsed.success) {
            return res.status(400).json({
                message: "Validation failed",
                errors: parsed.error.issues,
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

export async function login(req: Request, res: Response) {
    try {
        const parsed = loginSchema.safeParse(req.body);

        if (!parsed.success) {
            return res.status(400).json({
                message: "Validation failed",
                errors: parsed.error.issues,
            });
        }

        const { email, password } = parsed.data;

        const result = await pool.query(
            `
            SELECT id, username, email, password_hash, created_at, updated_at
            FROM users
            WHERE email = $1
            `,
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                message: "Invalid email or password",
            });
        }

        const user = result.rows[0];

        const passwordMatches = await bcrypt.compare(password, user.password_hash);

        if (!passwordMatches) {
            return res.status(401).json({
                message: "Invalid email or password",
            });
        }

        const secret = process.env.JWT_SECRET;
        if (!secret) {
            console.error("JWT_SECRET is missing");
            return res.status(500).json({
                message: "Internal server error",
            });
        }

        const token = jwt.sign(
            {
                userId: user.id,
                username: user.username,
                email: user.email,
            },
            secret,
            { expiresIn: "7d" }
        );

        return res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                created_at: user.created_at,
                updated_at: user.updated_at,
            },
        });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({
            message: "Internal server error",
        });
    }
}