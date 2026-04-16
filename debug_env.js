import 'dotenv/config';
import path from 'node:path';

function resolveDataProvider() {
  const explicitProvider = String(process.env.DATA_PROVIDER || '')
    .trim()
    .toLowerCase();

  if (explicitProvider === 'mongo' || explicitProvider === 'local') {
    return explicitProvider;
  }

  const uri = String(process.env.MONGODB_URI || '').trim();
  const isPlaceholder = uri.includes('<db_password>') || uri.includes('YOUR_');

  return (uri && !isPlaceholder) ? 'mongo' : 'local';
}

console.log('CWD:', process.cwd());
console.log('MONGODB_URI:', process.env.MONGODB_URI);
console.log('Is Placeholder?', String(process.env.MONGODB_URI || '').includes('<db_password>'));
console.log('Resolved Provider:', resolveDataProvider());
