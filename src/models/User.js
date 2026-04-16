import { randomUUID } from 'node:crypto';

export function createUser({ name, email, passwordHash, role }) {
  return {
    id: randomUUID(),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    passwordHash,
    role,
    createdAt: new Date().toISOString()
  };
}

export function sanitizeUser(user) {
  if (!user) {
    return null;
  }

  const { passwordHash, ...safeUser } = user;
  return safeUser;
}
