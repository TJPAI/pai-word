// B214: real PostgreSQL integration acceptance for the B209 reservation
// transaction against the isolated Neon QA project (schema core20k_qa).
//
// This test SKIPS unless CORE20K_QA_DATABASE_URL is set, so plain
// `node --test` runs (including CI without database secrets) stay green.
// A skip is NOT a real-database pass and must never be reported as one.
//
// When the URL is set, the test requires the `pg` driver (installed outside
// this repo for the QA run, e.g. `npm i pg` in a scratch directory, then run
// with NODE_PATH=<scratch>/node_modules). The URL is used only through the
// environment variable: it is never printed, logged, or stored by this file.
// The database user must be limited to the isolated QA project; this test
// touches only schema core20k_qa and deletes every row it creates.
//
// What it proves on a real database (not mocks):
//  1. B208 schema applies and the expected tables exist.
//  2. A happy-path reservation via a dedicated pool.connect() client writes
//     exactly one reservation row and exactly one RESERVED event.
//  3. A real pg Pool passed as the transaction client is rejected
//     (DEDICATED_CLIENT_REQUIRED), so pool transaction interleaving cannot
//     silently happen.
//  4. Mock approvals (boolean flag, wrong sense, wrong runtime hash) are
//     BLOCKED and change no rows.
//  5. Two dedicated connections racing the same reservation_key produce
//     exactly one winner row and one event; the loser is CONFLICT (or, if
//     PostgreSQL reports it, RETRYABLE) and leaves no partial rows.
//  6. A rolled-back transaction leaves neither a reservation nor an event.
//  7. Audit consistency: every test reservation has exactly one RESERVED
//     event and there are no orphan events.
//  8. Cleanup removes all test rows.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {reserveWithTransaction} from './b209_reservation_transaction.mjs';

const URL = process.env.CORE20K_QA_DATABASE_URL;
const PREFIX = `b214-acceptance-${Date.now()}-`;
const H1 = 'c'.repeat(64);
const H2 = 'd'.repeat(64);

const reqFor = (key, candidate) => ({
  reservation_key: key,
  candidate_id: candidate,
  headword_id: 'core20k:rank:714',
  sense_id: 'UNRESOLVED_PENDING_AUTHORITY',
  revision_sha256: H1,
  authority_release_id: 'b214-acceptance-fixture',
  runtime_sha256: H2,
});
const verify = async (r) => ({
  status: 'VERIFIED',
  candidate_id: r.candidate_id,
  headword_id: r.headword_id,
  sense_id: r.sense_id,
  revision_sha256: r.revision_sha256,
  authority_release_id: r.authority_release_id,
  runtime_sha256: r.runtime_sha256,
});

test('real postgres reservation acceptance', {skip: !URL, timeout: 120000}, async () => {
  let pg;
  try {
    pg = await import('pg');
  } catch {
    throw new Error('pg driver not installed: run `npm i pg` in a scratch directory and retry with NODE_PATH=<scratch>/node_modules');
  }
  const pool = new pg.Pool({connectionString: URL, max: 4});
  const countRows = async (keyPattern) => {
    const r = await pool.query(
      'SELECT (SELECT count(*) FROM core20k_qa.ku_reservations WHERE reservation_key LIKE $1) AS res, (SELECT count(*) FROM core20k_qa.registration_events WHERE reservation_key LIKE $1) AS ev',
      [keyPattern]);
    return {res: Number(r.rows[0].res), ev: Number(r.rows[0].ev)};
  };
  try {
    // 1. Server version and schema.
    const ver = await pool.query('SELECT version() AS v');
    assert.match(ver.rows[0].v, /PostgreSQL 18\./, 'expected PostgreSQL 18');
    const schemaSql = fs.readFileSync(new URL('./b208_isolated_registration_schema.sql', import.meta.url), 'utf8');
    const schemaClient = await pool.connect();
    try { await schemaClient.query(schemaSql); } finally { schemaClient.release(); }
    const tables = await pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema='core20k_qa' AND table_name IN ('ku_reservations','registration_events')");
    assert.deepEqual(tables.rows.map((r) => r.table_name).sort(), ['ku_reservations', 'registration_events']);

    // Defensive cleanup of any same-prefix leftovers, then confirm clean.
    await pool.query('DELETE FROM core20k_qa.registration_events WHERE reservation_key LIKE $1', [`${PREFIX}%`]);
    await pool.query('DELETE FROM core20k_qa.ku_reservations WHERE reservation_key LIKE $1', [`${PREFIX}%`]);
    assert.deepEqual(await countRows(`${PREFIX}%`), {res: 0, ev: 0});

    // 2. Happy path on a dedicated client; release restores pool counters.
    const idleBefore = pool.idleCount;
    const happyKey = `${PREFIX}happy`;
    const happyClient = await pool.connect();
    let happy;
    try { happy = await reserveWithTransaction(happyClient, reqFor(happyKey, `${PREFIX}c1`), verify); }
    finally { happyClient.release(); }
    assert.equal(happy.status, 'RESERVED');
    assert.equal(happy.formal_ku_id, null);
    assert.equal(happy.release_eligible, false);
    assert.equal(happy.srs_write_allowed, false);
    assert.deepEqual(await countRows(happyKey), {res: 1, ev: 1});
    assert.equal(pool.idleCount, idleBefore, 'dedicated client was not released');

    // 3. A real pg Pool as transaction client is rejected before any SQL.
    await assert.rejects(
      reserveWithTransaction(pool, reqFor(`${PREFIX}pool`, `${PREFIX}c-pool`), verify),
      (e) => e instanceof TypeError && e.message === 'DEDICATED_CLIENT_REQUIRED');
    assert.deepEqual(await countRows(`${PREFIX}pool`), {res: 0, ev: 0});

    // 4. Mock approvals are BLOCKED on the real database and change no rows.
    const mockCases = [
      ['boolean-approved', async () => ({approved: true})],
      ['wrong-sense', async (r) => ({...await verify(r), sense_id: 'WRONG_SENSE'})],
      ['wrong-runtime', async (r) => ({...await verify(r), runtime_sha256: '0'.repeat(64)})],
    ];
    for (const [name, mockVerify] of mockCases) {
      const key = `${PREFIX}mock-${name}`;
      const client = await pool.connect();
      let out;
      try { out = await reserveWithTransaction(client, reqFor(key, `${PREFIX}c-${name}`), mockVerify); }
      finally { client.release(); }
      assert.equal(out.status, 'BLOCKED', name);
      assert.deepEqual(await countRows(key), {res: 0, ev: 0}, name);
    }

    // 5. Dual-connection race on the same reservation_key: one winner only.
    const raceKey = `${PREFIX}race`;
    const clientA = await pool.connect();
    const clientB = await pool.connect();
    const [a, b] = await Promise.allSettled([
      (async () => { try { return await reserveWithTransaction(clientA, reqFor(raceKey, `${PREFIX}c-race`), verify); } finally { clientA.release(); } })(),
      (async () => { try { return await reserveWithTransaction(clientB, reqFor(raceKey, `${PREFIX}c-race`), verify); } finally { clientB.release(); } })(),
    ]);
    if (a.status === 'rejected') throw a.reason;
    if (b.status === 'rejected') throw b.reason;
    const sorted = [a.value.status, b.value.status].sort();
    assert.ok(
      (sorted[0] === 'CONFLICT' && sorted[1] === 'RESERVED') ||
      (sorted[0] === 'RESERVED' && sorted[1] === 'RETRYABLE'),
      `race outcomes must be one winner plus one safe loser, got ${sorted.join(',')}`);
    assert.deepEqual(await countRows(raceKey), {res: 1, ev: 1}, 'race left exactly one row and one event');

    // 6. Direct rollback atomicity: rolled-back rows must not exist.
    const rbKey = `${PREFIX}rollback`;
    const rbClient = await pool.connect();
    try {
      await rbClient.query('BEGIN ISOLATION LEVEL SERIALIZABLE');
      await rbClient.query(
        'INSERT INTO core20k_qa.ku_reservations (reservation_key,candidate_id,headword_id,sense_id,revision_sha256,authority_release_id,runtime_sha256) VALUES ($1,$2,$3,$4,$5,$6,$7)',
        [rbKey, `${PREFIX}c-rb`, 'core20k:rank:714', 'UNRESOLVED_PENDING_AUTHORITY', H1, 'b214-acceptance-fixture', H2]);
      await rbClient.query('INSERT INTO core20k_qa.registration_events (reservation_key,event_type) VALUES ($1,$2)', [rbKey, 'RESERVED']);
      await rbClient.query('ROLLBACK');
    } finally { rbClient.release(); }
    assert.deepEqual(await countRows(rbKey), {res: 0, ev: 0});

    // 7. Audit consistency across all test rows: 1 reservation == 1 event, no orphans.
    const audit = await pool.query(
      `SELECT (SELECT count(*) FROM core20k_qa.ku_reservations WHERE reservation_key LIKE $1) AS res,
              (SELECT count(*) FROM core20k_qa.registration_events WHERE reservation_key LIKE $1) AS ev,
              (SELECT count(*) FROM core20k_qa.registration_events e LEFT JOIN core20k_qa.ku_reservations r
                ON r.reservation_key = e.reservation_key WHERE e.reservation_key LIKE $1 AND r.reservation_key IS NULL) AS orphans,
              (SELECT count(*) FROM core20k_qa.ku_reservations r LEFT JOIN core20k_qa.registration_events e
                ON e.reservation_key = r.reservation_key WHERE r.reservation_key LIKE $1 AND e.event_id IS NULL) AS missing_events`,
      [`${PREFIX}%`]);
    const row = audit.rows[0];
    assert.equal(Number(row.res), Number(row.ev), 'reservation/event counts must match');
    assert.equal(Number(row.orphans), 0, 'no orphan events');
    assert.equal(Number(row.missing_events), 0, 'no reservation without an event');
  } finally {
    // 8. Cleanup: events first (FK), then reservations; then close the pool.
    try {
      await pool.query('DELETE FROM core20k_qa.registration_events WHERE reservation_key LIKE $1', [`${PREFIX}%`]);
      await pool.query('DELETE FROM core20k_qa.ku_reservations WHERE reservation_key LIKE $1', [`${PREFIX}%`]);
      assert.deepEqual(await countRows(`${PREFIX}%`), {res: 0, ev: 0}, 'cleanup left test rows');
    } finally {
      await pool.end();
    }
  }
});
