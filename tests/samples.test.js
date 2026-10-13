'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { importSamples } = require('../engine/samples');
const { createProject } = require('../engine/init');
const { writeJson, readJson } = require('../engine/io');

function project() {
  const dir = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'cmo-')), '.cmo');
  createProject(dir, { name: 'X', type: 'ai-adoption', language: 'ar', currency: 'SAR', startDate: '2026-01-01', endDate: '2026-12-31' });
  writeJson(dir, 'processes.json', { schemaVersion: 1, processes: [{ id: 'PR1', name: 'تقرير المبيعات / Sales report', frequencyPerMonth: 40, hourlyCost: 100, baseline: { minutes: 300 } }] });
  writeJson(dir, 'samples/PR1.json', { schemaVersion: 1, samples: [{ phase: 'before', minutes: 310 }] });
  return dir;
}
const file = (text) => {
  const f = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'cmo-s-')), 's.csv');
  fs.writeFileSync(f, text);
  return f;
};
const CSV = [
  'Timestamp,[PROCESS] العملية / Process,[PHASE] المرحلة / Phase,[MINUTES] الوقت (دقائق) / Minutes,[ERRORS] هل حدث خطأ؟ / Any errors?',
  '2026-06-02,Sales report,بعد / After,95,لا / No',
  '2026-06-03,PR1,after,88,نعم / Yes',
  '2026-06-04,Unknown process,before,10,No',
].join('\n');

test('preview, append and unknown process warning', () => {
  const dir = project();
  const p = importSamples(dir, { from: file(CSV) });
  assert.strictEqual(p.action, 'preview');
  assert.deepStrictEqual(p.counts, { PR1: { before: 0, after: 2 } });
  assert.deepStrictEqual(p.warnings.map((w) => w.code), ['PROCESS_UNKNOWN']);
  importSamples(dir, { from: file(CSV), write: true });
  const s = readJson(dir, 'samples/PR1.json').samples;
  assert.deepStrictEqual(s.map((x) => [x.phase, x.minutes, x.errors ?? null, x.date ?? null]), [
    ['before', 310, null, null],
    ['after', 95, 0, '2026-06-02'],
    ['after', 88, 1, '2026-06-03'],
  ]);
});

test('replace mode', () => {
  const dir = project();
  importSamples(dir, { from: file(CSV), write: true, replace: true });
  assert.strictEqual(readJson(dir, 'samples/PR1.json').samples.length, 2);
});
