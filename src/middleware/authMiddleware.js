import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { getUserById } from '../services/authService.js';
import { HttpError } from '../utils/httpError.js';

export async function optionalAuth(req, _res, next) {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith('Bearer ')) {
      return next();
    }

    const token = header.replace('Bearer ', '').trim();
    const payload = jwt.verify(token, env.jwtSecret);
    const user = await getUserById(payload.sub);

    if (user) {
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name
      };
    }

    return next();
  } catch {
    return next();
  }
}

export async function protect(req, _res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return next(new HttpError(401, 'Authentication is required.'));
  }

  try {
    const token = header.replace('Bearer ', '').trim();
    const payload = jwt.verify(token, env.jwtSecret);
    const user = await getUserById(payload.sub);

    if (!user) {
      return next(new HttpError(401, 'Session is no longer valid.'));
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    };

    return next();
  } catch {
    return next(new HttpError(401, 'Invalid or expired authentication token.'));
  }
}
