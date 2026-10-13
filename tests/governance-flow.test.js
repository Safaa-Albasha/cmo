'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { run } = require('../engine/cli');

test('propose → approvals → batch apply → decisions → plan/impact', () => {
  const dir = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'cmo-')), '.cmo');
  fs.cpSync(path.join(__dirname, '..', 'examples', 'ai-adoption', '.cmo'), dir, { recursive: true });
  const mk = (id) => JSON.stringify({ agent: 'resistance-manager', title: id, operation: { op: 'add', file: 'resistance.json', item: { id, group: 'OPS', rootCause: 'reinforcement', status: 'open', signal: 'workload' } } });
  assert.strictEqual(run(['propose', '--dir', dir, '--json', mk('RS-T1')]).out.id, 'APR-0001');
  assert.strictEqual(run(['propose', '--dir', dir, '--json', mk('RS-T2')]).out.id, 'APR-0002');
  assert.strictEqual(run(['approvals', '--dir', dir]).out.length, 2);
  const b = run(['apply', '--dir', dir, '--ids', 'APR-0001,APR-0002,APR-0404', '--decision', 'approve', '--by', 'Sara']).out;
  assert.deepStrictEqual(b.results.map((r) => r.ok), [true, true, false]);
  assert.strictEqual(run(['decisions', '--dir', dir]).out.length, 2);
  const plan = run(['plan', '--dir', dir, '--today', '2026-10-13']).out;
  assert.strictEqual(plan.kotter.length, 8);
  assert.ok(plan.total >= 17);
  assert.ok(run(['impact', '--dir', dir]).out.totalHeadcount > 300);
  const st = run(['status', '--dir', dir]).out;
  assert.ok(st.resistance.open >= 2);
  assert.strictEqual(run(['timing-form', '--dir', dir]).out.files.length, 3);
});
