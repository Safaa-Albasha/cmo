'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { surveyItems, googleAppsScript, msFormsDocx } = require('../engine/forms');
const { createWave, generateSurvey } = require('../engine/survey');
const { createProject } = require('../engine/init');
const { writeJson, readJson } = require('../engine/io');
const { unzip } = require('../engine/zip');

const bank = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'templates', 'ai-adoption', 'bank.json'), 'utf8'));
const groups = [{ id: 'FIN', name: 'المالية / Finance' }, { id: 'IT', name: 'تقنية المعلومات / IT' }];

test('items carry ids and bilingual text', () => {
  const items = surveyItems(bank, groups);
  const byId = Object.fromEntries(items.map((i) => [i.id, i]));
  assert.strictEqual(byId.GROUP.kind, 'dropdown');
  assert.deepStrictEqual(byId.GROUP.options, ['المالية / Finance', 'تقنية المعلومات / IT']);
  assert.strictEqual(byId.D1.title, '[D1] أريد استخدام أدوات الذكاء الاصطناعي في عملي / I want to use AI tools in my work');
  assert.strictEqual(byId.D1.options[0], '1 - لا أوافق بشدة / Strongly disagree');
  assert.deepStrictEqual(byId.USE.options, ['أبدًا / Never', 'شهريًا / Monthly', 'أسبوعيًا / Weekly', 'يوميًا / Daily']);
  assert.strictEqual(byId.O1.kind, 'text');
  assert.strictEqual(surveyItems(bank, groups, ['GROUP', 'A1']).length, 2);
});

test('Apps Script creates an anonymous form with a responses sheet', () => {
  const js = googleAppsScript('Survey "x"', surveyItems(bank, groups));
  assert.match(js, /function createSurvey\(\)/);
  assert.match(js, /FormApp\.create\("Survey \\"x\\""\)/);
  assert.match(js, /setCollectEmail\(false\)/);
  assert.match(js, /addScaleItem\(\)\.setTitle\("\[A1\]/);
  assert.match(js, /addListItem\(\)\.setTitle\("\[GROUP\]/);
  assert.match(js, /addParagraphTextItem\(\)\.setTitle\("\[O1\]/);
  assert.match(js, /setDestination\(FormApp\.DestinationType\.SPREADSHEET/);
  assert.doesNotThrow(() => new Function(js));
});

test('Quick Import docx is a valid package with numbered questions and lettered options', () => {
  const files = unzip(msFormsDocx('T', surveyItems(bank, groups)));
  assert.ok(files['[Content_Types].xml'] && files['_rels/.rels']);
  const doc = files['word/document.xml'].toString('utf8');
  assert.match(doc, /3\. \[A1\] /);
  assert.match(doc, /A\. 1 - لا أوافق بشدة/);
  assert.match(doc, /<w:bidi\/>/);
});

test('createWave and generateSurvey write files', () => {
  const dir = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'cmo-')), '.cmo');
  createProject(dir, { name: 'X', type: 'ai-adoption', language: 'ar', currency: 'SAR', startDate: '2026-01-01', endDate: '2026-12-31' });
  assert.throws(() => createWave(dir, { wave: 'baseline', type: 'baseline', date: '2026-02-01' }) && generateSurvey(dir, { wave: 'baseline' }), (e) => e.code === 'GROUPS_REQUIRED');
  writeJson(dir, 'groups.json', { schemaVersion: 1, groups });
  const g = generateSurvey(dir, { wave: 'baseline' });
  assert.deepStrictEqual(g.files.map((f) => path.basename(f)), ['survey-baseline-google.gs', 'survey-baseline-msforms.docx', 'survey-baseline.md']);
  assert.strictEqual(readJson(dir, 'surveys/baseline/meta.json').questions.length, bank.questions.length);
  assert.throws(() => createWave(dir, { wave: 'baseline', type: 'baseline', date: '2026-02-01' }), (e) => e.code === 'WAVE_EXISTS');
  assert.throws(() => createWave(dir, { wave: 'p', type: 'x', date: '2026-02-01' }), (e) => e.code === 'ENUM_INVALID');
});

test('timing form round-trips through samples import', () => {
  const dir = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'cmo-')), '.cmo');
  fs.cpSync(path.join(__dirname, '..', 'examples', 'ai-adoption', '.cmo'), dir, { recursive: true });
  const { generateTimingForm } = require('../engine/survey');
  const { importSamples } = require('../engine/samples');
  const r = generateTimingForm(dir);
  const gs = fs.readFileSync(r.files[0], 'utf8');
  assert.match(gs, /requireNumber\(\)/);
  assert.match(gs, /\[PROCESS\]/);
  const csv = path.join(path.dirname(dir), 't.csv');
  fs.writeFileSync(csv, 'Timestamp,[PROCESS] العملية / Process,[PHASE] المرحلة / Phase,[MINUTES] الوقت (دقائق) / Minutes,[ERRORS] هل حدث خطأ؟ / Any errors?\n2026-09-01,صياغة الوصف الوظيفي / Job description drafting,بعد الذكاء الاصطناعي / With AI,35,لا / No\n');
  assert.deepStrictEqual(importSamples(dir, { from: csv }).counts, { PR4: { before: 0, after: 1 } });
});
