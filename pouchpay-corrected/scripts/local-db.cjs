'use strict';
const path = require('node:path');
const fs = require('node:fs');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const action = process.argv[2];
function run(file, args, extra = {}) {
  const result = spawnSync(file, args, {cwd: root, env: process.env, stdio: 'inherit', ...extra});
  if (result.error) throw new Error('Unable to run the local database tool.');
  return result.status ?? 1;
}
async function main() {
  if (!['start', 'stop', 'status', 'check', 'generate', 'validate', 'migrate', 'create-migration', 'serve'].includes(action)) throw new Error('Unknown local database command.');
  if (['start', 'stop'].includes(action)) return run('docker', ['compose', '-f', path.join(root, 'compose.local.yml'), ...(action === 'start' ? ['up', '-d', '--wait'] : ['stop'])]);
  const file = path.join(root, '.env.local.database');
  if (!fs.existsSync(file)) throw new Error('Local database configuration is missing.');
  // Explicitly replace inherited production URLs for every db:local command.
  require('dotenv').config({path: file, override: true, quiet: true});
  process.env.DATABASE_ENV_FILE = '.env.local.database';
  const url = new URL(process.env.DATABASE_URL || '');
  const shadow = new URL(process.env.SHADOW_DATABASE_URL || '');
  if (![url, shadow].every(u => u.protocol === 'postgresql:' && u.hostname === '127.0.0.1' && u.port === '55432' && u.username === 'pouchpay_local') || url.pathname !== '/pouchpay_local' || shadow.pathname !== '/pouchpay_shadow') throw new Error('Local commands refuse database URLs outside the dedicated local PostgreSQL databases.');
  if (['status', 'migrate'].includes(action)) return run(process.execPath, [path.join(root, 'scripts', 'prisma-db.cjs'), action === 'status' ? 'status' : 'deploy']);
  if (action === 'create-migration') {
    const name = process.argv[3] || 'init';
    if (!/^[a-z][a-z0-9_]{0,63}$/.test(name)) throw new Error('Migration name must use lowercase letters, numbers and underscores.');
    const schema = fs.readFileSync(path.join(root, 'prisma', 'schema.prisma'), 'utf8');
    if (!/^\s*model\s+\w+\s*\{/m.test(schema)) throw new Error('Define and review application models in prisma/schema.prisma before creating a migration.');
    return run(process.execPath, [require.resolve('prisma/build/index.js'), 'migrate', 'dev', '--create-only', '--name', name]);
  }
  if (['generate', 'validate'].includes(action)) return run(process.execPath, [require.resolve('prisma/build/index.js'), action]);
  if (action === 'serve') {
    process.env.PORT = process.env.LOCAL_APP_PORT || '3300';
    process.env.APP_BIND_ADDRESS = '127.0.0.1';
    return run(process.execPath, [path.join(root, 'dist', 'main.js')]);
  }
  // Real Nest dependency injection, real Prisma/pg connection, temporary data only.
  const { NestFactory } = require('@nestjs/core');
  const { AppModule } = require(path.join(root, 'dist', 'app.module.js'));
  const { PrismaService } = require(path.join(root, 'dist', 'prisma', 'prisma.service.js'));
  const app = await NestFactory.createApplicationContext(AppModule, {logger: false});
  try {
    const prisma = app.get(PrismaService);
    const status = await prisma.checkConnection();
    if (!status.ready) throw new Error('Local PostgreSQL connection check failed. Run npm run db:local:start.');
    const metadata = await prisma.client.$queryRaw`SELECT current_database() AS database, current_user AS role, (SELECT rolsuper FROM pg_roles WHERE rolname=current_user) AS superuser`;
    if (metadata[0].database !== 'pouchpay_local' || metadata[0].superuser !== false) throw new Error('Unexpected database or database role.');
    const before = await prisma.client.$queryRaw`SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename`;
    await prisma.client.$transaction(async tx => {
      await tx.$executeRaw`CREATE TEMP TABLE prisma_local_smoke (value INTEGER) ON COMMIT DROP`;
      await tx.$executeRaw`INSERT INTO prisma_local_smoke(value) VALUES (42)`;
      const rows = await tx.$queryRaw`SELECT value FROM prisma_local_smoke`;
      if (rows[0]?.value !== 42) throw new Error('Local temporary read/write test failed.');
    });
    const after = await prisma.client.$queryRaw`SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename`;
    if (JSON.stringify(before) !== JSON.stringify(after)) throw new Error('Unexpected persistent schema change.');
    console.log('PASS: Nest Prisma provider connected to local PostgreSQL.');
    console.log('PASS: Non-superuser app role; temporary transaction read/write; cleanup.');
    console.log('Persistent application tables unchanged. No production database was contacted.');
    return 0;
  } finally { await app.close(); }
}
main().then(code => {process.exitCode = code;}).catch(error => {
  console.error(error.code ? 'Local database command failed (' + String(error.code) + '); connection details are hidden.' : /postgres(?:ql)?:\/\//i.test(error.message) ? 'Local database command failed; connection details are hidden.' : error.message);
  process.exitCode = 1;
});
