// scripts/createAdminUser.js
// ─────────────────────────────────────────────────────────────────────────────
// Create or update an admin account (upsert by username). The password comes
// ONLY from the ADMIN_PASSWORD environment variable and is never printed.
//
// Usage:
//   ADMIN_PASSWORD='...' node scripts/createAdminUser.js \
//       --username Admin --email admin@telugusambandham.com \
//       --name "Admin" --role moderator
//
// Roles: admin | superadmin | moderator
// ─────────────────────────────────────────────────────────────────────────────

const path = require('path');
// Load backend/src/.env or backend/.env (whichever exists); in Docker the
// variables already come from the container environment.
require('dotenv').config({ path: path.join(__dirname, '..', 'src', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) out[argv[i].slice(2)] = argv[++i];
  }
  return out;
}

async function main() {
  const { ROLES } = require('../src/services/adminPermissions');
  const args = parseArgs(process.argv.slice(2));
  const username = (args.username || '').trim();
  const email = (args.email || '').trim();
  const name = (args.name || username).trim();
  const role = (args.role || '').trim();
  const password = process.env.ADMIN_PASSWORD;

  if (!username || !email || !role) {
    console.error('Usage: ADMIN_PASSWORD=... node scripts/createAdminUser.js --username U --email E [--name N] --role ' + ROLES.join('|'));
    process.exit(1);
  }
  if (!ROLES.includes(role)) {
    console.error(`Invalid role. Use one of: ${ROLES.join(', ')}`);
    process.exit(1);
  }
  if (!password || password.length < 8) {
    console.error('ADMIN_PASSWORD env var is required (min 8 characters).');
    process.exit(1);
  }

  const pool = require('../src/services/pool');
  const { hashPassword } = require('../src/services/passwordfunction');

  try {
    const clash = await pool.query(
      'SELECT username FROM public.adminlogin WHERE email = $1 AND username <> $2',
      [email, username]
    );
    if (clash.rows.length) {
      console.error('That email already belongs to a different admin username. Nothing changed.');
      await pool.end();
      process.exit(1);
    }

    const hash = await hashPassword(password);
    const { rows } = await pool.query(
      `INSERT INTO public.adminlogin (username, email, password, name, role)
            VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (username) DO UPDATE
          SET email    = EXCLUDED.email,
              password = EXCLUDED.password,
              name     = EXCLUDED.name,
              role     = EXCLUDED.role
       RETURNING id, username, email, role`,
      [username, email, hash, name, role]
    );
    const a = rows[0];
    console.log(`Admin ready -> id=${a.id} username=${a.username} email=${a.email} role=${a.role}`);
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error(`createAdminUser failed: ${err.message}`);
    try { await pool.end(); } catch (_) { /* best effort */ }
    process.exit(1);
  }
}

main();
