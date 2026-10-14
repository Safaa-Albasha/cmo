'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const util = require('../engine/util');
const { nudges, ar } = require('../engine/nudges');
const { validate } = require('../engine/validate');
const { loadProject, readJson, writeJson } = require('../engine/io');
const { createProject } = require('../engine/init');
const { run } = require('../engine/cli');
const session = require('../hooks/session');

const EX = path.join(__dirname, '..', 'examples', 'ai-adoption');
const EXDIR = path.join(EX, '.cmo');

test('today uses the project time zone, not UTC', () => {
  const lateEvening = new Date('2026-10-14T21:30:00Z'); // 01:30 on the 15th in Dubai
  assert.strictEqual(util.today('Asia/Dubai', lateEvening), '2026-10-15');
  assert.strictEqual(util.today('UTC', lateEvening), '2026-10-14');
  assert.strictEqual(util.today('Not/AZone', lateEvening), '2026-10-15'); // falls back to Asia/Dubai
  assert.strictEqual(util.DEFAULT_TIMEZONE, 'Asia/Dubai');
});

test('new projects default to Asia/Dubai; invalid zones and cadences are rejected', () => {
  const dir = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'cmo-tz-')), '.cmo');
  createProject(dir, { name: 'X', type: 'generic', language: 'ar', currency: 'AED', startDate: '2026-01-01', endDate: '2026-12-31' });
  assert.strictEqual(readJson(dir, 'project.json').timezone, 'Asia/Dubai');
  const d = loadProject(dir);
  d.project.timezone = 'Mars/Base';
  d.project.cadence = { pulseDays: 3 };
  const codes = validate(d).errors.map((e) => e.code);
  assert.ok(codes.includes('TIMEZONE_INVALID'));
  assert.ok(codes.includes('NUMBER_RANGE'));
});

test('Arabic counting agrees with the number', () => {
  const W = ['تعليق واحد', 'تعليقان', 'تعليقات', 'تعليقًا'];
  assert.deepStrictEqual([1, 2, 7, 32].map((n) => ar(n, W)), ['تعليق واحد', 'تعليقان', '7 تعليقات', '32 تعليقًا']);
});

test('example project: overdue survey, stale usage, comments and overdue plan work', () => {
  const r = nudges(EXDIR, loadProject(EXDIR), { today: '2026-10-14' });
  assert.strictEqual(r.timezone, 'Asia/Dubai');
  const byType = Object.fromEntries(r.items.map((x) => [x.type, x]));
  assert.strictEqual(byType['pulse-due'].days, 105); // pulse-2 on 2026-07-01
  assert.strictEqual(byType['usage-stale'].days, 75); // usage 2026-07-31
  assert.ok(byType['comments-pending'].count > 0);
  assert.strictEqual(byType['plan-overdue'].count, 1);
  assert.ok(!byType.approvals);
  assert.match(r.line.en, /^CMO · last survey was 105 days ago/);
  assert.match(r.line.ar, /آخر استبيان قبل 105 يومًا/);
});

test('nothing due → no line; cadence comes from project.json', () => {
  const r = nudges(EXDIR, loadProject(EXDIR), { today: '2026-07-02' });
  assert.ok(!r.items.some((x) => x.type === 'pulse-due' || x.type === 'usage-stale'));
  const d = loadProject(EXDIR);
  d.project.cadence = { pulseDays: 30 };
  const r2 = nudges(EXDIR, d, { today: '2026-08-05' });
  assert.strictEqual(r2.items.find((x) => x.type === 'pulse-due').days, 35);
});

test('fresh project nudges for a baseline survey only after the start date', () => {
  const dir = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'cmo-n-')), '.cmo');
  createProject(dir, { name: 'X', type: 'generic', language: 'en', currency: 'AED', startDate: '2026-03-01', endDate: '2026-12-31' });
  assert.deepStrictEqual(nudges(dir, loadProject(dir), { today: '2026-02-20' }).items, []);
  assert.strictEqual(nudges(dir, loadProject(dir), { today: '2026-03-02' }).line.en, 'CMO · no baseline survey yet → /cmo:survey');
  const p = readJson(dir, 'project.json');
  p.tools = [{ id: 'copilot', name: 'Copilot', licenses: 10, costPerLicensePerMonth: 30 }];
  writeJson(dir, 'project.json', p);
  assert.ok(nudges(dir, loadProject(dir), { today: '2026-05-01' }).items.some((x) => x.type === 'usage-missing'));
});

test('cli nudges returns the line', () => {
  const r = run(['nudges', '--dir', EXDIR, '--today', '2026-10-14']);
  assert.strictEqual(r.code, 0);
  assert.ok(r.out.line.ar.startsWith('CMO · '));
});

test('SessionStart hook: line inside a project, silent outside or on bad input', () => {
  const out = JSON.parse(session.main(JSON.stringify({ cwd: EX })));
  assert.strictEqual(out.hookSpecificOutput.hookEventName, 'SessionStart');
  assert.match(out.systemMessage, /^CMO · /);
  assert.strictEqual(session.main(JSON.stringify({ cwd: os.tmpdir() })), '');
  assert.doesNotThrow(() => session.main('not json'));
});

test('SessionStart hook flags an invalid project instead of crashing', () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'cmo-h-'));
  createProject(path.join(cwd, '.cmo'), { name: 'X', type: 'generic', language: 'en', currency: 'AED', startDate: '2026-03-01', endDate: '2026-12-31' });
  const p = readJson(path.join(cwd, '.cmo'), 'project.json');
  p.timezone = 'Nope/Nope';
  writeJson(path.join(cwd, '.cmo'), 'project.json', p);
  assert.match(JSON.parse(session.main(JSON.stringify({ cwd }))).systemMessage, /\/cmo:setup/);
});
