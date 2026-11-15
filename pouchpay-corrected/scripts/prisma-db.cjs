'use strict';
const path = require('node:path');
const fs = require('node:fs');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
require('dotenv').config({ path: path.resolve(root, process.env.DATABASE_ENV_FILE || '.env'), quiet: true });
function main(action = process.argv[2]) {
  if (!['status', 'deploy'].includes(action)) throw new Error('Use npm run db:status or npm run db:migrate:deploy.');
  const value = process.env.DATABASE_URL?.trim();
  if (!value) throw new Error('DATABASE_URL is missing. Configure PostgreSQL locally using .env.database.example; do not share the password.');
  let url;
  try { url = new URL(value); } catch { throw new Error('DATABASE_URL is not a valid PostgreSQL URL.'); }
  if (!['postgres:', 'postgresql:'].includes(url.protocol) || !url.hostname || /DB_HOST|APP_USER|URL_ENCODED_PASSWORD|DB_NAME|YOUR_/i.test(value)) throw new Error('Replace the example DATABASE_URL with your real PostgreSQL connection settings.');
  if (action === 'deploy') {
    const migrations = path.join(root, 'prisma', 'migrations');
    const exists = fs.existsSync(migrations) && fs.readdirSync(migrations).some(name => fs.existsSync(path.join(migrations, name, 'migration.sql')));
    if (!exists) throw new Error('No reviewed SQL migrations exist. Define application models and create/review migrations against a separate development database first.');
  }
  const cli = require.resolve('prisma/build/index.js');
  const result = spawnSync(process.execPath, [cli, 'migrate', action], { cwd: root, env: process.env, stdio: 'inherit' });
  if (result.error) throw new Error('Unable to start the locally installed Prisma CLI.');
  return result.status ?? 1;
}
if (require.main === module) {
  try { process.exitCode = main(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = { main };
