import fs from 'node:fs/promises';
import path from 'node:path';
import { env } from '../config/env.js';

const EMPTY_DB = {
  users: [],
  photos: [],
  comments: [],
  ratings: []
};

const dbFilePath = path.join(env.dataDir, 'db.json');

function cloneDatabase(database) {
  if (typeof structuredClone === 'function') {
    return structuredClone(database);
  }

  return JSON.parse(JSON.stringify(database));
}

export async function ensureStorage() {
  await fs.mkdir(env.dataDir, { recursive: true });
  await fs.mkdir(env.uploadDir, { recursive: true });

  try {
    await fs.access(dbFilePath);
  } catch {
    await fs.writeFile(dbFilePath, JSON.stringify(EMPTY_DB, null, 2), 'utf8');
  }
}

export async function readDatabase() {
  await ensureStorage();
  const raw = await fs.readFile(dbFilePath, 'utf8');

  if (!raw.trim()) {
    return cloneDatabase(EMPTY_DB);
  }

  return JSON.parse(raw);
}

export async function writeDatabase(database) {
  await ensureStorage();
  await fs.writeFile(dbFilePath, JSON.stringify(database, null, 2), 'utf8');
  return database;
}
