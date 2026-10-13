'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { propose, apply, list, PROTECTED } = require('../engine/approvals');
const { readJson } = require('../engine/io');

function copy() {
  const dir = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'cmo-')), '.cmo');
  fs.cpSync(path.join(__dirname, '..', 'examples', 'ai-adoption', '.cmo'), dir, { recursive: true });
  return dir;
}
const act = { id: 'X01', phase: 'manage', kotterStep: 5, adkar: ['desire'], lever: 'coaching', status: 'planned', groups: ['FIN'], title: { ar: 'جلسات سفراء للمالية', en: 'Champion sessions for Finance' } };

test('protected list', () => {
  for (const f of ['plan.json', 'groups.json', 'project.json', 'processes.json', 'resistance.json', 'sponsors.json', 'decisions.json']) assert.ok(PROTECTED.includes(f), f);
});

test('add activity: queued, then applied and logged', () => {
  const dir = copy();
  const n = readJson(dir, 'plan.json').activities.length;
  const a = propose(dir, { agent: 'change-strategist', title: 'Add Finance champion sessions', operation: { op: 'add', file: 'plan.json', item: act } });
  assert.deepStrictEqual([a.id, a.status], ['APR-0001', 'pending']);
  assert.strictEqual(readJson(dir, 'plan.json').activities.length, n);
  apply(dir, a.id, 'approve', { by: 'Sara' });
  assert.strictEqual(readJson(dir, 'plan.json').activities.length, n + 1);
  assert.strictEqual(readJson(dir, 'decisions.json').decisions[0].by, 'Sara');
  assert.strictEqual(list(dir).length, 0);
});

test('reject, set, champions collection', () => {
  const dir = copy();
  propose(dir, { agent: 'x', operation: { op: 'update', file: 'groups.json', id: 'FIN', changes: { impactLevel: 5 } } });
  apply(dir, 'APR-0001', 'reject', { by: 'Sara', note: 'no' });
  assert.strictEqual(readJson(dir, 'groups.json').groups.find((g) => g.id === 'FIN').impactLevel, 4);
  propose(dir, { agent: 'x', operation: { op: 'set', file: 'project.json', path: 'currency', value: 'KWD' } });
  apply(dir, 'APR-0002', 'approve', { by: 'Sara' });
  assert.strictEqual(readJson(dir, 'project.json').currency, 'KWD');
  const before = (readJson(dir, 'sponsors.json').champions || []).length;
  propose(dir, { agent: 'x', operation: { op: 'add', file: 'sponsors.json', collection: 'champions', item: { id: 'CH-X', name: 'Champion', group: 'FIN' } } });
  apply(dir, 'APR-0003', 'approve', { by: 'Sara' });
  assert.strictEqual(readJson(dir, 'sponsors.json').champions.length, before + 1);
});

test('invalid, not allowed, stale', () => {
  const dir = copy();
  assert.throws(() => propose(dir, { agent: 'x', operation: { op: 'add', file: 'plan.json', item: { ...act, kotterStep: 9 } } }), (e) => e.code === 'VALIDATION_FAILED');
  assert.strictEqual(list(dir, 'all').length, 0);
  assert.throws(() => propose(dir, { agent: 'x', operation: { op: 'add', file: 'sponsors.json', collection: 'nope', item: { id: 'a' } } }), (e) => e.code === 'FILE_NOT_ALLOWED');
  assert.throws(() => propose(dir, { agent: 'x', operation: { op: 'set', file: 'plan.json', path: 'x', value: 1 } }), (e) => e.code === 'FILE_NOT_ALLOWED');
  assert.throws(() => propose(dir, { agent: 'x', operation: { op: 'delete', file: 'plan.json', id: 'P01' } }), (e) => e.code === 'OP_INVALID');
  propose(dir, { agent: 'x', operation: { op: 'update', file: 'plan.json', id: 'M06', changes: { status: 'done' } } });
  propose(dir, { agent: 'x', operation: { op: 'update', file: 'plan.json', id: 'M06', changes: { owner: 'Communications team' } } });
  apply(dir, 'APR-0002', 'approve', { by: 'S' });
  assert.throws(() => apply(dir, 'APR-0001', 'approve', { by: 'S' }), (e) => e.code === 'PROPOSAL_STALE');
});
