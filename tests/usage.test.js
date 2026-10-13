'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { importUsage } = require('../engine/usage');
const { createProject } = require('../engine/init');
const { writeJson, readJson } = require('../engine/io');

function project() {
  const dir = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'cmo-')), '.cmo');
  createProject(dir, { name: 'X', type: 'ai-adoption', language: 'ar', currency: 'SAR', startDate: '2026-01-01', endDate: '2026-12-31' });
  writeJson(dir, 'groups.json', { schemaVersion: 1, groups: [{ id: 'FIN', name: 'المالية / Finance' }, { id: 'IT', name: 'تقنية المعلومات / IT' }] });
  return dir;
}
const file = (name, text) => {
  const f = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'cmo-u-')), name);
  fs.writeFileSync(f, text);
  return f;
};

const REPORT = [
  'User Principal Name,Display Name,Last activity date (UTC),Word Copilot last activity date,Excel Copilot last activity date,Teams Copilot last activity date,Active days',
  'a@x.com,A,2026-07-30,2026-07-30,2026-07-20,2026-07-29,20',
  'b@x.com,B,2026-07-10,2026-07-10,,,3',
  'c@x.com,C,,,,,',
  'd@x.com,D,2026-07-31,2026-07-31,,,8',
  'e@x.com,E,2026-07-31,,,,4',
].join('\n');
const ROSTER = 'Email,Department\na@x.com,Finance\nb@x.com,المالية\nc@x.com,FIN\nd@x.com,IT\n';

test('per-user report with roster', () => {
  const dir = project();
  const r = importUsage(dir, { from: file('r.csv', REPORT), roster: file('roster.csv', ROSTER), date: '2026-07-31', tool: 'copilot', write: true });
  assert.strictEqual(r.mode, 'per-user');
  assert.strictEqual(r.unmappedUsers, 1);
  const snap = readJson(dir, 'usage/2026-07-31.json');
  const fin = snap.tools[0].groups.find((g) => g.group === 'FIN');
  assert.deepStrictEqual(fin, { group: 'FIN', licensed: 3, activated: 2, activeWeekly: 1, avgActiveDays: 5, avgFeatures: 3, powerUsers: 1, retained30d: 2 });
  assert.ok(!JSON.stringify(snap).includes('@'));
});

test('report without department needs a roster', () => {
  const dir = project();
  assert.throws(() => importUsage(dir, { from: file('r.csv', REPORT), date: '2026-07-31', tool: 'copilot' }), (e) => e.code === 'ROSTER_REQUIRED');
});

test('aggregated file merges into an existing snapshot by tool', () => {
  const dir = project();
  importUsage(dir, { from: file('r.csv', REPORT), roster: file('roster.csv', ROSTER), date: '2026-07-31', tool: 'copilot', write: true });
  const agg = 'Department,Licensed,Activated,Weekly active users,Average active days per week\nIT,20,15,10,2.5\n';
  importUsage(dir, { from: file('a.csv', agg), date: '2026-07-31', tool: 'claude', write: true });
  const snap = readJson(dir, 'usage/2026-07-31.json');
  assert.deepStrictEqual(snap.tools.map((t) => t.tool), ['copilot', 'claude']);
  assert.deepStrictEqual(snap.tools[1].groups[0], { group: 'IT', licensed: 20, activated: 15, activeWeekly: 10, avgActiveDays: 2.5, avgFeatures: null, powerUsers: null, retained30d: null });
});

test('unrecognised file', () => {
  const dir = project();
  assert.throws(() => importUsage(dir, { from: file('x.csv', 'a,b\n1,2\n'), date: '2026-07-31', tool: 'x' }), (e) => e.code === 'IMPORT_MODE');
});
