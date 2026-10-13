'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { validate } = require('../engine/validate');

const base = () => ({
  project: { name: 'X', type: 'ai-adoption', language: 'ar', currency: 'SAR', startDate: '2026-01-01', endDate: '2026-12-31', privacy: { minGroupSize: 5 } },
  groups: { groups: [{ id: 'FIN', name: 'Finance', headcount: 60, impactLevel: 4 }] },
  bank: { questions: [{ id: 'A1', type: 'likert', element: 'awareness' }, { id: 'O1', type: 'open' }] },
  waves: [{ id: 'w1', meta: { type: 'baseline', date: '2026-03-01' }, responses: [{ key: 'r1', group: 'FIN', answers: { A1: 4, O1: 'x' } }], labels: { labels: [{ id: 'r1:O1', sentiment: 1, confidence: 0.9, themes: [] }] } }],
  usage: [{ date: '2026-03-31', file: 'usage/2026-03-31.json', tools: [{ tool: 'copilot', groups: [{ group: 'FIN', licensed: 10, activated: 8, activeWeekly: 5 }] }] }],
  processes: { processes: [{ id: 'P1', name: 'n', frequencyPerMonth: 10, hourlyCost: 50, baseline: { minutes: 30 } }] },
  samples: { P1: [{ phase: 'before', minutes: 20 }] },
});
const codes = (r) => r.errors.map((e) => e.code).sort();

test('valid project', () => {
  const r = validate(base());
  assert.strictEqual(r.ok, true, JSON.stringify(r.errors));
  assert.deepStrictEqual(r.warnings, []);
});

test('project errors', () => {
  const d = base();
  d.project.type = 'other';
  d.project.currency = 7;
  d.project.privacy.minGroupSize = 1;
  delete d.project.name;
  assert.deepStrictEqual(codes(validate(d)), ['CURRENCY_INVALID', 'ENUM_INVALID', 'FIELD_REQUIRED', 'NUMBER_RANGE']);
});

test('survey, label, usage, process and sample errors', () => {
  const d = base();
  d.waves[0].meta.type = 'x';
  d.waves[0].responses[0].answers.A1 = 9;
  d.waves[0].responses[0].answers.ZZ = 3;
  d.waves[0].labels.labels[0].sentiment = 2;
  d.usage[0].tools[0].groups[0].licensed = -1;
  d.processes.processes.push({ id: 'P1', name: 'dup', frequencyPerMonth: 1, hourlyCost: 1, baseline: { minutes: 1 } });
  d.samples.P1[0].phase = 'during';
  const r = validate(d);
  assert.deepStrictEqual(codes(r), ['ENUM_INVALID', 'ENUM_INVALID', 'ENUM_INVALID', 'ID_DUPLICATE', 'NUMBER_RANGE', 'NUMBER_RANGE']);
  assert.deepStrictEqual(r.warnings.map((w) => w.code).sort(), ['UNKNOWN_QUESTION', 'USAGE_INCONSISTENT']);
});

test('unknown group is a warning', () => {
  const d = base();
  d.waves[0].responses[0].group = 'NOPE';
  assert.deepStrictEqual(validate(d).warnings.map((w) => w.code), ['UNKNOWN_GROUP']);
});
