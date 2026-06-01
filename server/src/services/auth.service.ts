import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { pool } from "../config/db";
import { AppError } from "../errors/AppError";
import { LoginSchemaType, RegisterSchemaType } from "../schemas/auth.schema";
import { env } from "../config/env";
import type { SafeUser, User } from "../types/user";

type LoginResult = {
    token: string;
    user: SafeUser;
};

export async function registerUser(input: RegisterSchemaType): Promise<SafeUser> {
    const { username, email, password } = input;

    const existingUser = await pool.query(
        `
        SELECT id
        FROM users
        WHERE username = $1 OR email = $2
        `,
        [username, email]
    );

    if (existingUser.rows.length > 0) {
        throw new AppError("Username-ul sau email-ul este deja folosit.", 409);
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

    return result.rows[0];
}

export async function loginUser(input: LoginSchemaType): Promise<LoginResult> {
    const { email, password } = input;

    const result = await pool.query(
        `
        SELECT id, username, email, password_hash, created_at, updated_at
        FROM users
        WHERE email = $1
        `,
        [email]
    );

    if (result.rows.length === 0) {
        throw new AppError("Email sau parolă incorectă.", 401);
    }

    const user = result.rows[0] as User;

    const passwordMatches = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
        throw new AppError("Email sau parolă incorectă.", 401);
    }

    const secret = env.jwtSecret;

    const token = jwt.sign(
        {
            userId: user.id,
            username: user.username,
            email: user.email,
        },
        secret,
        { expiresIn: "7d" }
    );

    return {
        token,
        user: {
            id: user.id,
            username: user.username,
            email: user.email,
            created_at: user.created_at,
            updated_at: user.updated_at,
        },
    };
}