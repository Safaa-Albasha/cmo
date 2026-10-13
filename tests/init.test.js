'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { createProject } = require('../engine/init');
const { loadProject } = require('../engine/io');
const { validate } = require('../engine/validate');
const { status } = require('../engine/status');

const opts = { name: 'تبنّي Copilot', type: 'ai-adoption', language: 'ar', currency: 'SAR', startDate: '2026-01-01', endDate: '2026-12-31' };

test('creates a valid AI-adoption project with templates and a private salt', () => {
  const dir = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'cmo-')), '.cmo');
  const r = createProject(dir, opts);
  assert.ok(r.files.includes('surveys/bank.json'));
  const d = loadProject(dir);
  assert.strictEqual(validate(d).ok, true);
  assert.strictEqual(d.plan.activities.length, 17);
  assert.strictEqual(d.bank.questions.filter((q) => q.type === 'likert' && q.element).length, 10);
  assert.match(fs.readFileSync(path.join(dir, '.salt'), 'utf8'), /^[0-9a-f]{32}$/);
  assert.match(fs.readFileSync(path.join(dir, '.gitignore'), 'utf8'), /\.salt/);
  const s = status(d);
  assert.deepStrictEqual(s.notes.sort(), ['NO_PROCESSES', 'NO_SURVEY', 'NO_USAGE']);
});

test('generic project has an empty plan; refuses overwrite and missing args', () => {
  const dir = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'cmo-')), '.cmo');
  createProject(dir, { ...opts, type: 'generic' });
  assert.strictEqual(loadProject(dir).plan.activities.length, 0);
  assert.throws(() => createProject(dir, opts), (e) => e.code === 'PROJECT_EXISTS');
  assert.throws(() => createProject(dir + 'x', { ...opts, name: '' }), (e) => e.code === 'ARG_MISSING');
});
