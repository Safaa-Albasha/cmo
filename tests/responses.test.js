'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { importResponses } = require('../engine/responses');
const { createProject } = require('../engine/init');
const { createWave } = require('../engine/survey');
const { writeJson, readJson } = require('../engine/io');
const { createZip } = require('../engine/zip');

function project() {
  const dir = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'cmo-')), '.cmo');
  createProject(dir, { name: 'X', type: 'ai-adoption', language: 'ar', currency: 'SAR', startDate: '2026-01-01', endDate: '2026-12-31' });
  writeJson(dir, 'groups.json', { schemaVersion: 1, groups: [{ id: 'FIN', name: 'المالية / Finance' }, { id: 'IT', name: 'تقنية المعلومات / IT' }] });
  createWave(dir, { wave: 'baseline', type: 'baseline', date: '2026-02-01' });
  return dir;
}
const write = (name, text) => {
  const f = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'cmo-f-')), name);
  fs.writeFileSync(f, text);
  return f;
};

const GOOGLE = [
  'Timestamp,Email Address,[GROUP] القسم / Department,[ROLE] الدور / Role,[A1] أفهم لماذا / I understand why,[D1] x,[USE] y,[O1] z',
  '2026/02/03 10:00,ahmad@corp.com,المالية,مدير / Manager,٤,أوافق بشدة / Strongly agree,أسبوعيًا / Weekly,"اسألوا أحمد على 0551234567 أو ahmad@corp.com"',
  '2026/02/03 10:05,AHMAD@corp.com,Finance,Staff,3,2 - لا أوافق / Disagree,Daily,',
  '2026/02/03 11:00,mona@corp.com,IT,Staff,9,5,Never,good',
  '2026/02/03 12:00,x@corp.com,Marketing,Staff,3,3,Never,',
].join('\n');

test('preview maps columns and changes nothing', () => {
  const dir = project();
  const r = importResponses(dir, { from: write('g.csv', GOOGLE), wave: 'baseline' });
  assert.strictEqual(r.action, 'preview');
  const roles = Object.fromEntries(r.mapping.map((m) => [m.header, m.role === 'question' ? m.id : m.role]));
  assert.strictEqual(roles.Timestamp, 'meta');
  assert.strictEqual(roles['Email Address'], 'identity');
  assert.strictEqual(roles['[D1] x'], 'D1');
  assert.strictEqual(r.count, 2);
  assert.deepStrictEqual(r.groups, { FIN: 1, IT: 1 });
  assert.deepStrictEqual(r.warnings.map((w) => w.code).sort(), ['UNMAPPED_GROUP', 'UNMAPPED_VALUE']);
  assert.ok(!fs.existsSync(path.join(dir, 'surveys', 'baseline', 'responses.json')));
});

test('write pseudonymises, de-duplicates, parses values and scrubs text', () => {
  const dir = project();
  importResponses(dir, { from: write('g.csv', GOOGLE), wave: 'baseline', write: true });
  const saved = readJson(dir, 'surveys/baseline/responses.json');
  const raw = JSON.stringify(saved);
  assert.ok(!/@|ahmad|0551234567/i.test(raw), raw);
  const fin = saved.responses.find((x) => x.group === 'FIN');
  assert.match(fin.key, /^r_[0-9a-f]{12}$/);
  assert.deepStrictEqual([fin.answers.A1, fin.answers.D1, fin.answers.ROLE, fin.answers.USE, fin.role], [3, 2, 'staff', 'daily', 'staff']);
  const it = saved.responses.find((x) => x.group === 'IT');
  assert.strictEqual(it.answers.A1, undefined);
  assert.strictEqual(it.answers.D1, 5);
  assert.strictEqual(saved.responses.length, 2);
});

test('Microsoft Forms xlsx with ID/Name columns', () => {
  const dir = project();
  const rows = [
    ['ID', 'Start time', 'Completion time', 'Email', 'Name', '[GROUP] القسم / Department', '[A1] t', '[O1] c'],
    ['1', '2/3/26 10:00', '2/3/26 10:04', 'anonymous', 'Sara Ali', 'المالية / Finance', '1 - لا أوافق بشدة / Strongly disagree', 'Sara Ali thinks it is slow'],
  ];
  const cell = (v, r, c) => `<c r="${String.fromCharCode(65 + c)}${r}" t="inlineStr"><is><t>${v}</t></is></c>`;
  const sheet = rows.map((row, i) => `<row r="${i + 1}">${row.map((v, c) => cell(v, i + 1, c)).join('')}</row>`).join('');
  const f = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'cmo-x-')), 'ms.xlsx');
  fs.writeFileSync(f, createZip({ 'xl/workbook.xml': '<workbook><sheets><sheet name="Sheet1" r:id="rId1"/></sheets></workbook>', 'xl/_rels/workbook.xml.rels': '<Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/></Relationships>', 'xl/worksheets/sheet1.xml': `<worksheet><sheetData>${sheet}</sheetData></worksheet>` }));
  importResponses(dir, { from: f, wave: 'baseline', write: true });
  const r = readJson(dir, 'surveys/baseline/responses.json').responses[0];
  assert.deepStrictEqual([r.group, r.answers.A1, r.answers.O1], ['FIN', 1, '[name] thinks it is slow']);
});

test('errors: missing group column, unknown wave, missing salt', () => {
  const dir = project();
  assert.throws(() => importResponses(dir, { from: write('n.csv', 'a,b\n1,2\n'), wave: 'baseline' }), (e) => e.code === 'NO_GROUP_COLUMN');
  assert.throws(() => importResponses(dir, { from: write('g.csv', GOOGLE), wave: 'nope' }), (e) => e.code === 'WAVE_NOT_FOUND');
  fs.unlinkSync(path.join(dir, '.salt'));
  assert.throws(() => importResponses(dir, { from: write('g.csv', GOOGLE), wave: 'baseline' }), (e) => e.code === 'SALT_MISSING');
});
