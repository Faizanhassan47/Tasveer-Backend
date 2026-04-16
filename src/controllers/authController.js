import { authenticateUser, getSafeUserById, registerUser } from '../services/authService.js';

export async function register(req, res) {
  const response = await registerUser(req.body);
  res.status(201).json(response);
}

export async function login(req, res) {
  const response = await authenticateUser(req.body);
  res.json(response);
}

export async function me(req, res) {
  const user = await getSafeUserById(req.user.id);
  res.json({ user });
}
