import bcrypt from 'bcryptjs';
import { sanitizeUser } from '../models/User.js';
import { dataProvider } from '../data/dataProvider.js';
import { generateToken } from '../utils/generateToken.js';
import { HttpError } from '../utils/httpError.js';
import { isValidEmail, isValidRole, normalizeEmail } from '../utils/validators.js';

function buildAuthResponse(user) {
  return {
    token: generateToken(user),
    user: sanitizeUser(user)
  };
}

export async function registerUser({ name, email, password, role }) {
  const normalizedEmail = normalizeEmail(email);
  const trimmedName = String(name || '').trim();
  const trimmedPassword = String(password || '');
  const trimmedRole = String(role || '').trim().toLowerCase();

  if (!trimmedName || !normalizedEmail || !trimmedPassword || !trimmedRole) {
    throw new HttpError(400, 'Name, email, password, and role are required.');
  }

  if (!isValidEmail(normalizedEmail)) {
    throw new HttpError(400, 'Please provide a valid email address.');
  }

  if (trimmedPassword.length < 6) {
    throw new HttpError(400, 'Password must be at least 6 characters long.');
  }

  if (!isValidRole(trimmedRole)) {
    throw new HttpError(400, 'Role must be either creator or consumer.');
  }

  const existingUser = await dataProvider.findUserByEmail(normalizedEmail);

  if (existingUser) {
    throw new HttpError(409, 'An account with that email already exists.');
  }

  const passwordHash = await bcrypt.hash(trimmedPassword, 10);
  let user;

  try {
    user = await dataProvider.createUserRecord({
      name: trimmedName,
      email: normalizedEmail,
      passwordHash,
      role: trimmedRole
    });
  } catch (error) {
    if (error?.code === 11000) {
      throw new HttpError(409, 'An account with that email already exists.');
    }

    throw error;
  }

  return buildAuthResponse(user);
}

export async function authenticateUser({ email, password }) {
  const normalizedEmail = normalizeEmail(email);
  const trimmedPassword = String(password || '');

  if (!normalizedEmail || !trimmedPassword) {
    throw new HttpError(400, 'Email and password are required.');
  }

  const user = await dataProvider.findUserByEmail(normalizedEmail);

  if (!user) {
    throw new HttpError(401, 'Invalid email or password.');
  }

  const isMatch = await bcrypt.compare(trimmedPassword, user.passwordHash);

  if (!isMatch) {
    throw new HttpError(401, 'Invalid email or password.');
  }

  return buildAuthResponse(user);
}

export async function getUserById(userId) {
  return dataProvider.findUserById(userId);
}

export async function getSafeUserById(userId) {
  const user = await getUserById(userId);
  return sanitizeUser(user);
}
