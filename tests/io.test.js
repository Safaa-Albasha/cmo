'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { mean, variance, pct, round } = require('../engine/util');
const { format } = require('../engine/i18n');
const { CmoError, writeJson, loadProject } = require('../engine/io');

test('util math', () => {
  assert.strictEqual(mean([1, 2, 3]), 2);
  assert.strictEqual(mean([]), null);
  assert.strictEqual(variance([2, 4, 4, 4, 5, 5, 7, 9]), 32 / 7);
  assert.strictEqual(pct(1, 3), 33.3);
  assert.strictEqual(pct(1, 0), null);
  assert.strictEqual(round(2.345, 2), 2.35);
});

test('format is bilingual', () => {
  const m = format('FILE_MISSING', { file: 'x.json' });
  assert.match(m.ar, /x\.json/);
  assert.match(m.en, /x\.json/);
});

test('loadProject reads waves, usage and samples', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cmo-'));
  writeJson(dir, 'project.json', { name: 'x' });
  writeJson(dir, 'surveys/bank.json', { questions: [] });
  writeJson(dir, 'surveys/w2/meta.json', { type: 'pulse', date: '2026-05-01' });
  writeJson(dir, 'surveys/w1/meta.json', { type: 'baseline', date: '2026-03-01' });
  writeJson(dir, 'surveys/w1/responses.json', { responses: [{ key: 'r1', group: 'G', answers: {} }] });
  writeJson(dir, 'usage/2026-04-30.json', { tools: [] });
  writeJson(dir, 'usage/2026-03-31.json', { tools: [] });
  writeJson(dir, 'samples/P1.json', { samples: [{ phase: 'before', minutes: 5 }] });
  const d = loadProject(dir);
  assert.deepStrictEqual(d.waves.map((w) => w.id), ['w1', 'w2']);
  assert.strictEqual(d.waves[0].responses.length, 1);
  assert.deepStrictEqual(d.waves[1].responses, []);
  assert.strictEqual(d.waves[1].labels, null);
  assert.deepStrictEqual(d.usage.map((u) => u.date), ['2026-03-31', '2026-04-30']);
  assert.strictEqual(d.samples.P1.length, 1);
  assert.strictEqual(d.groups, null);
  assert.throws(() => loadProject(path.join(dir, 'nope')), (e) => e instanceof CmoError && e.code === 'FILE_MISSING');
});
