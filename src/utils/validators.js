const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const USER_ROLES = ['creator', 'consumer'];

export function isValidEmail(value) {
  return EMAIL_REGEX.test(String(value || '').trim().toLowerCase());
}

export function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

export function isValidRole(value) {
  return USER_ROLES.includes(value);
}

export function parseTags(value) {
  if (Array.isArray(value)) {
    return value
      .map((entry) => String(entry || '').trim())
      .filter(Boolean);
  }

  return String(value || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function parseRatingValue(value) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 5) {
    return null;
  }

  return parsed;
}
