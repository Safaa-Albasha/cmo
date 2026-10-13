'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { run } = require('../engine/cli');
const { writeJson } = require('../engine/io');

test('wave → survey → import responses → comments → label → status', () => {
  const dir = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'cmo-')), '.cmo');
  assert.strictEqual(run(['init', '--dir', dir, '--name', 'X', '--language', 'en', '--currency', 'USD', '--start', '2026-01-01', '--end', '2026-12-31']).code, 0);
  writeJson(dir, 'groups.json', { schemaVersion: 1, groups: [{ id: 'G1', name: 'Group one' }] });
  assert.strictEqual(run(['wave', '--dir', dir, '--id', 'baseline', '--type', 'baseline', '--date', '2026-02-01']).code, 0);
  const s = run(['survey', '--dir', dir, '--wave', 'baseline']);
  assert.strictEqual(s.out.files.length, 3);
  const csv = ['[GROUP] g,[A1] a,[D1] d,[O1] o'];
  for (let i = 0; i < 6; i++) csv.push(`Group one,${(i % 5) + 1},4,comment ${i}`);
  const f = path.join(path.dirname(dir), 'r.csv');
  fs.writeFileSync(f, csv.join('\n'));
  assert.strictEqual(run(['import', '--dir', dir, '--type', 'responses', '--wave', 'baseline', '--from', f]).out.action, 'preview');
  assert.strictEqual(run(['import', '--dir', dir, '--type', 'responses', '--wave', 'baseline', '--from', f, '--write']).out.count, 6);
  const q = run(['comments', '--dir', dir, '--wave', 'baseline']).out;
  assert.strictEqual(q.total, 6);
  const lf = path.join(path.dirname(dir), 'labels.json');
  fs.writeFileSync(lf, JSON.stringify(q.items.map((c, i) => ({ id: c.id, sentiment: i % 2 ? 1 : -1, themes: ['productivity'], adkar: null, confidence: 0.9 }))));
  assert.strictEqual(run(['label', '--dir', dir, '--wave', 'baseline', '--file', lf]).out.added, 6);
  assert.strictEqual(run(['review', '--dir', dir, '--wave', 'baseline']).out.items.length, 0);
  const st = run(['status', '--dir', dir]).out;
  assert.strictEqual(st.people.latest.sentiment.overall.net, 0);
  assert.strictEqual(st.pending.unlabeled, 0);
});

test('usage and samples import through the CLI', () => {
  const dir = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'cmo-')), '.cmo');
  run(['init', '--dir', dir, '--name', 'X', '--language', 'en', '--currency', 'USD', '--start', '2026-01-01', '--end', '2026-12-31']);
  writeJson(dir, 'groups.json', { schemaVersion: 1, groups: [{ id: 'G1', name: 'Group one' }] });
  writeJson(dir, 'processes.json', { schemaVersion: 1, processes: [{ id: 'P1', name: 'Proc', frequencyPerMonth: 10, hourlyCost: 10, baseline: { minutes: 30 } }] });
  const u = path.join(path.dirname(dir), 'u.csv');
  fs.writeFileSync(u, 'Group,Licensed,Activated,Weekly active users\nGroup one,10,8,6\n');
  assert.strictEqual(run(['import', '--dir', dir, '--type', 'usage', '--from', u, '--tool', 'copilot', '--date', '2026-03-31', '--write']).code, 0);
  const sp = path.join(path.dirname(dir), 's.csv');
  fs.writeFileSync(sp, 'Process,Phase,Minutes\nP1,before,30\nP1,after,12\n');
  assert.strictEqual(run(['import', '--dir', dir, '--type', 'samples', '--from', sp, '--write']).code, 0);
  const st = run(['status', '--dir', dir]).out;
  assert.strictEqual(st.adoption.latest.overall.reach, 60);
  assert.strictEqual(st.value.processes[0].evidence.status, 'preliminary');
  assert.strictEqual(run(['import', '--dir', dir, '--type', 'nope', '--from', u]).out.error.code, 'ENUM_INVALID');
});
