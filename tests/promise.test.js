'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const promise = require('../engine/promise');
const { generateSurvey, generateTimingForm, createWave } = require('../engine/survey');
const { createProject } = require('../engine/init');
const { writeJson, readJson } = require('../engine/io');
const { unzip } = require('../engine/zip');
const { run } = require('../engine/cli');

const bank = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'templates', 'ai-adoption', 'bank.json'), 'utf8'));
const groups = [{ id: 'FIN', name: 'المالية / Finance' }, { id: 'IT', name: 'تقنية المعلومات / IT' }];

function project(min) {
  const dir = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'cmo-promise-')), '.cmo');
  createProject(dir, { name: 'X', type: 'ai-adoption', language: 'ar', currency: 'SAR', startDate: '2026-01-01', endDate: '2026-12-31' });
  const p = readJson(dir, 'project.json');
  p.privacy.minGroupSize = min;
  p.changeManager = 'سارة / Sara';
  writeJson(dir, 'project.json', p);
  writeJson(dir, 'groups.json', { schemaVersion: 1, groups });
  return dir;
}

test('intro uses the configured minimum group size, not a hard-coded 5', () => {
  const t = promise.intro({ privacy: { minGroupSize: 7 } }, { minutes: 4 });
  assert.match(t.ar, /أقل من 7 أشخاص/);
  assert.match(t.en, /fewer than 7 people/);
  assert.match(t.en, /about 4 minutes/);
  assert.doesNotMatch(t.en + t.ar, /\b5\b/);
  assert.match(promise.intro({}).en, /fewer than 5 people/); // default
  assert.doesNotMatch(promise.intro({}, { comments: false }).en, /comments/);
});

test('Arabic counted nouns agree with the number', () => {
  assert.strictEqual(promise.arPeople(5), '5 أشخاص');
  assert.strictEqual(promise.arPeople(10), '10 أشخاص');
  assert.strictEqual(promise.arPeople(12), '12 شخصًا');
  assert.match(promise.intro({ privacy: { minGroupSize: 15 } }, { minutes: 12 }).ar, /أقل من 15 شخصًا.*حوالي 12 دقيقة/);
});

test('estimateMinutes counts open questions as longer', () => {
  assert.strictEqual(promise.estimateMinutes({ questions: [{ id: 'A', type: 'likert' }] }), 2);
  const qs = Array.from({ length: 18 }, (_, i) => ({ id: `L${i}`, type: 'likert' })).concat([{ id: 'O1', type: 'open' }, { id: 'O2', type: 'open' }]);
  assert.strictEqual(promise.estimateMinutes({ questions: qs }), 5); // 180 s + 120 s
  assert.strictEqual(promise.estimateMinutes({ questions: [] }), null);
});

test('facts follow the bank: role and comments sections appear only when asked', () => {
  const f = promise.facts({ privacy: { minGroupSize: 6 } }, bank, ['GROUP', 'A1']);
  assert.deepStrictEqual([f.minGroupSize, f.asksRole, f.hasComments], [6, false, false]);
  const md = promise.markdown(f);
  assert.doesNotMatch(md, /### التعليقات|### Comments/);
  assert.doesNotMatch(md, /role \(staff/);
  const all = promise.markdown(promise.facts({}, bank));
  assert.match(all, /### Comments/);
  assert.match(all, /role \(staff, manager or executive\)/);
});

test('survey files and privacy sheet all say the configured size (7)', () => {
  const dir = project(7);
  createWave(dir, { wave: 'baseline', type: 'baseline', date: '2026-02-01' });
  const g = generateSurvey(dir, { wave: 'baseline' });
  const gs = fs.readFileSync(g.files[0], 'utf8');
  const doc = unzip(fs.readFileSync(g.files[1]))['word/document.xml'].toString('utf8');
  const md = fs.readFileSync(g.files[2], 'utf8');
  for (const text of [gs, doc, md]) {
    assert.match(text, /fewer than 7 people/);
    assert.match(text, /أقل من 7 أشخاص/);
    assert.doesNotMatch(text, /at least 5 people|5 أشخاص على الأقل/);
  }
  assert.doesNotThrow(() => new Function(gs));
  assert.deepStrictEqual(g.privacySheet.map((f) => path.basename(f)), ['privacy-sheet.md', 'privacy-sheet.html']);
  const html = fs.readFileSync(g.privacySheet[1], 'utf8');
  assert.match(html, /No group under 7 people/);
  assert.match(html, /fewer than 7 people is hidden/);
  assert.match(html, /سارة \/ Sara/);
  assert.doesNotMatch(html, /__[A-Z]+__/);
});

test('timing form intro has the size but no comment promise', () => {
  const dir = project(8);
  writeJson(dir, 'processes.json', { schemaVersion: 1, processes: [{ id: 'P1', name: 'Report', group: 'FIN', frequencyPerMonth: 10, hourlyCost: 100, baseline: { minutes: 60, source: 'estimate' } }] });
  const t = generateTimingForm(dir);
  const md = fs.readFileSync(t.files[2], 'utf8');
  assert.match(md, /fewer than 8 people/);
  assert.doesNotMatch(md, /removed from comments/);
});

test('cli privacy-sheet writes the sheet from the project settings', () => {
  const dir = project(9);
  const r = run(['privacy-sheet', '--dir', dir]);
  assert.strictEqual(r.code, 0);
  assert.strictEqual(r.out.minGroupSize, 9);
  assert.match(fs.readFileSync(path.join(dir, 'drafts', 'privacy-sheet.md'), 'utf8'), /أقل من 9 أشخاص/);
});
