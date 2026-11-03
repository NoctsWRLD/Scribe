/**
 * Behavioural check of `firestore.rules` against the Firestore emulator.
 *
 * `npm test` stays fast and offline, so the rules are not part of it: this
 * script is the separate, slower check. It seeds two accounts as admin, then
 * makes the requests a hostile client would make and asserts the answer.
 *
 *   npm run rules:check
 *
 * Needs Java and the Firestore emulator (downloaded on first run by
 * `firebase-tools`). Nothing here touches a real project: the emulator uses the
 * `demo-scribe` project id, which is local only.
 */
const host = process.env.FIRESTORE_EMULATOR_HOST;
if (!host) {
  console.error('This script is meant to run inside `firebase emulators:exec`. Use `npm run rules:check`.');
  process.exit(1);
}

const base = `http://${host}/v1/projects/demo-scribe/databases/(default)/documents`;

/** An unsigned token is enough: the emulator does not verify signatures. */
function token(uid) {
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  return `${encode({ alg: 'none', typ: 'JWT' })}.${encode({ sub: uid, iat: now, exp: now + 3600 })}.`;
}

async function call(method, path, { uid, body, mask } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (uid === 'admin') headers.Authorization = 'Bearer owner';
  else if (uid) headers.Authorization = `Bearer ${token(uid)}`;

  const query = mask ? `?${mask.map((field) => `updateMask.fieldPaths=${field}`).join('&')}` : '';
  const response = await fetch(`${base}${path}${query}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: response.status, text: await response.text() };
}

const results = [];
function check(name, actual, expected) {
  const passed = actual === expected;
  results.push(`${passed ? 'PASS' : 'FAIL'}  ${name} — got ${actual}, expected ${expected}`);
}

const string = (value) => ({ stringValue: value });
const timestamp = new Date().toISOString();

// A request with no token must be refused. If it is not, the emulator is
// running without the rules file and every check below would pass for the
// wrong reason.
const anonymous = await call('GET', '/users/nobody');
if (anonymous.status !== 403) {
  console.error(
    `Refusing to report: an unauthenticated read answered ${anonymous.status} instead of 403.\n`
    + 'The emulator is not running firestore.rules — check "firestore.rules" in firebase.emulator.json.',
  );
  process.exit(1);
}

function account(uid, code) {
  return {
    fields: {
      displayName: string(uid),
      email: string(`${uid}@example.com`),
      school: string('Gimnazija'),
      photoURL: string(''),
      createdAt: { timestampValue: timestamp },
      ...(code ? { friendCode: string(code) } : {}),
    },
  };
}

// ── Seed: two accounts, and one code already owned by the second ─────────────
await call('PATCH', '/users/A', { uid: 'admin', body: account('A', 'AAAAAA') });
await call('PATCH', '/users/B', { uid: 'admin', body: account('B', 'BBBBBB') });
for (const [code, uid] of [['AAAAAA', 'A'], ['BBBBBB', 'B']]) {
  await call('PATCH', `/userCodes/${code}`, {
    uid: 'admin',
    body: { fields: { uid: string(uid), createdAt: { timestampValue: timestamp } } },
  });
}

// ── The language preference ──────────────────────────────────────────────────
let response = await call('PATCH', '/users/A', {
  uid: 'A',
  body: { fields: { locale: string('en') } },
  mask: ['locale'],
});
check('a supported language is saved', response.status, 200);

response = await call('PATCH', '/users/A', {
  uid: 'A',
  body: { fields: { locale: string('xx') } },
  mask: ['locale'],
});
check('an unknown language is refused', response.status, 403);

response = await call('PATCH', '/users/B', {
  uid: 'A',
  body: { fields: { locale: string('en') } },
  mask: ['locale'],
});
check("another account's profile cannot be edited", response.status, 403);

// ── Friend-code ownership ────────────────────────────────────────────────────
response = await call('PATCH', '/users/A', {
  uid: 'A',
  body: { fields: { friendCode: string('BBBBBB') } },
  mask: ['friendCode'],
});
check("a code owned by another account cannot be displayed", response.status, 403);

response = await call('PATCH', '/users/A', {
  uid: 'A',
  body: { fields: { friendCode: string('A2B3C4') } },
  mask: ['friendCode'],
});
check('an unused code can be taken', response.status, 200);

// ── The default deny ─────────────────────────────────────────────────────────
response = await call('DELETE', '/users/A', { uid: 'B' });
check("another account's profile cannot be deleted", response.status, 403);

response = await call('DELETE', '/users/A', { uid: 'A' });
check('an own profile can be deleted', response.status, 200);

response = await call('GET', '/users/C', { uid: 'A' });
check('an unseeded profile is not readable', response.status, 403);

console.log(results.join('\n'));
process.exitCode = results.some((line) => line.startsWith('FAIL')) ? 1 : 0;
