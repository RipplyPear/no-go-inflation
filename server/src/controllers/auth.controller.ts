import { NextFunction, Request, Response } from 'express';

import { loginSchema, registerSchema } from '../schemas/auth.schema';
import { loginUser, registerUser } from '../services/auth.service';

function getAuthValidationError(issue: { code: string; path: PropertyKey[] }) {
  const field = String(issue.path[0] ?? '');

  if (field === 'username' && issue.code === 'too_small') {
    return { code: 'AUTH_USERNAME_TOO_SHORT', params: { min: 3 } };
  }

  if (field === 'username' && issue.code === 'too_big') {
    return { code: 'AUTH_USERNAME_TOO_LONG', params: { max: 50 } };
  }

  if (field === 'email') {
    return { code: 'AUTH_INVALID_EMAIL', params: {} };
  }

  if (field === 'password' && issue.code === 'too_small') {
    return { code: 'AUTH_PASSWORD_TOO_SHORT', params: { min: 6 } };
  }

  return { code: 'AUTH_INVALID_INPUT', params: {} };
}

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = registerSchema.safeParse(req.body);

    if (!parsed.success) {
      const error = getAuthValidationError(parsed.error.issues[0]);

      return res.status(400).json(error);
    }

    const user = await registerUser(parsed.data);

    return res.status(201).json({
      message: 'Cont creat cu succes.',
      user,
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = loginSchema.safeParse(req.body);

    if (!parsed.success) {
      const error = getAuthValidationError(parsed.error.issues[0]);

      return res.status(400).json(error);
    }

    const result = await loginUser(parsed.data);

    return res.status(200).json({
      message: 'Autentificare reușită.',
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    next(error);
  }
}
